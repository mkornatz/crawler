import async from 'async';
import request from 'request';
import cheerio from 'cheerio';
import Url from 'url';
import UrlParser from 'url-parse';
import {EventEmitter} from 'events';
import _ from 'lodash';

/**
 * The main crawler class that can crawl URLs
 */
export default class Crawler {
  constructor(options) {
    const self = this;

    self.options = _.defaults(options, {
      concurrency: 10,
      url: null,
      crawlDomains: [],
    });

    if (_.isEmpty(self.options.url)) {
      throw new Error('You must specify a URL to crawl.');
    }

    self.queued = 0;
    self.completed = 0;
    self.foundUrls = [];
    self.crawledUrls = [];
    self.domains = [];
    self.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36';

    // Add the url domain and other allowed domains to
    // be crawled
    const parsedUrl = new UrlParser(self.options.url);
    self.addDomainToCrawl(parsedUrl.host);
    _.each(self.options.crawlDomains, self.addDomainToCrawl.bind(this));

    self.crawlingQueue = async.queue(self._task.bind(self), self.options.concurrency);
    self.emitter = new EventEmitter();
  }

  /**
   * Adds a domain to the list of allowed domains to crawl. URLs found
   * with a domain not in this list will be requested, but not
   * crawled for more URLs.
   * @param {string} domain
   */
  addDomainToCrawl(domain) {
    this.domains.push(domain);
  }

  /**
   * Determines if url should be crawled based on domain
   * @param  {Response} response object
   * @return {bool}
   */
  shouldCrawl(res) {
    const uri = res.request.uri.href;

    // only crawl pages if the scheme is http(s)
    if (uri.indexOf('http://') < 0 && uri.indexOf('https://') < 0) {
      return false;
    }
    // don't crawl pages that aren't html
    if (res.headers['content-type'] && res.headers['content-type'].indexOf('html') < 0) {
      return false;
    }

    const parsedUrl = new UrlParser(uri);

    // Is domain allowed?
    if (_.indexOf(this.domains, parsedUrl.host) === -1){
      return false;
    }

    return this.crawledUrls.indexOf(uri) === -1;
  }

  /**
   * Sets a listener for an event
   */
  on(type, listener) {
    this.emitter.on(type, listener);
    return this;
  }

  /**
   * Starts the crawling process
   */
  start() {
    var self = this;
    self.queued = 1;
    self.crawlingQueue.push({
      url: self.options.url,
    });
  }

  /**
   * The main crawl handler for the async crawl process
   */
  _task(task, callback) {
    var self = this;

    const requestOptions = {
      url: task.url,
      encoding: 'utf8',
      followRedirect: true,
      followAllRedirects: true,
      rejectUnauthorized: false,
      headers: {
        // 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        // 'Accept-Encoding': 'gzip, deflate, br',
        Referer: task.parentUrl,
        'User-Agent': self.userAgent,
      },
    };

    request
      .get(requestOptions, (err, response, body) => {
        if (err || (response && response.statusCode >= 400)) {
          self.emitter.emit('error', task.url, task.parentUrl, err, response);
          self.completed++;
          callback(err);

          if (self.queued - self.completed === 0) {
            self.emitter.emit('complete');
          }

          return;
        } else {
          self.emitter.emit('success', task.url, task.parentUrl || 'base', response);
        }

        // Prevent crawling if we shouldn't
        if (self.shouldCrawl(response)) {
          self.emitter.emit('crawl', task.url);

          var $ = cheerio.load(body);

          const baseHref = $('base').attr('href');

          $('a[href], link[href]').each((index, el) => {
            var href = $(el).attr('href');
            if (_.isEmpty(href)) {
              return;
            }
            self._handleFoundUrl({
              foundAtUrl: task.url,
              url: href,
              baseHref,
            });
          });

          $('img[src], script[src]').each((index, el) => {
            var src = $(el).attr('src');
            if (_.isEmpty(src)) {
              return;
            }
            self._handleFoundUrl({
              foundAtUrl: task.url,
              url: src,
              baseHref,
            });
          });
        }

        // Add this to the list of crawled URLs
        self.crawledUrls.push(task.url);

        self.completed++;
        callback();
        if (self.queued - self.completed === 0) {
          self.emitter.emit('complete');
        }
      })
      .setMaxListeners(0);
  }

  /**
   * Resolves an absolute or relative URL into an absolute URL
   *
   * @param {string} urlToResolve - an absolute or relative url
   * @param {string} parentUrl - the url at which this URL was found
   */
  _resolveUrl(options) {
    let parsedUrl;

    // If the url is relative, use the parent's url to resolve
    if (options.url.indexOf('http') === 0) {
      parsedUrl = new UrlParser(options.url);
    } else if (options.baseHref) {
      parsedUrl = new UrlParser(Url.resolve(options.baseHref, options.url));
    } else {
      parsedUrl = new UrlParser(Url.resolve(options.foundAtUrl, options.url));
    }

    return [parsedUrl.protocol, '//', parsedUrl.host, parsedUrl.pathname, parsedUrl.query].join('');
  }

  /**
   * Emits a `found` event which can determine whether or not the url
   * should be crawled.
   * @param {object} options { url, parentUrl }
   */
  _handleFoundUrl(options) {
    const found = this._resolveUrl(options);

    // Only allow http and https URLs
    if (found.indexOf('http') < 0) {
      return;
    }

    // Don't "find" a url that we've already found
    if (this.foundUrls.indexOf(found) >= 0) {
      return;
    }

    this.emitter.emit('found', found, options.foundAtUrl);

    this.queued++;
    this.foundUrls.push(found);

    this.crawlingQueue.push({
      url: found,
      parentUrl: options.foundAtUrl,
    });
  }

  /**
   * Determines if a URL has already been crawled
   * @param url
   */
  alreadyCrawled(url) {
    console.log(this.crawlDomains, url);
    return this.crawlDomains.indexOf(url) >= 0;
  }
}
