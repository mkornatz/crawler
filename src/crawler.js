import async from 'async';
import request from 'request';
import cheerio from 'cheerio';
import Url from 'url';
import UrlParser from 'url-parse';
import { EventEmitter } from 'events';
import { defaults, isArray, isEmpty } from 'lodash';
import Task from './task';

const defaultOptions = {
  concurrency: 10,
  allowedDomains: [],
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
};

/**
 * The main crawling state manager.
 */
export default class Crawler extends EventEmitter {
  constructor(url, options) {
    if (isEmpty(url) || url === '') {
      throw new Error('You must specify a URL to crawl.');
    }

    super(); // Must call for this to be defined

    this.url = url;
    this.queued = 0;
    this.completed = 0;
    this.foundUrls = [];
    this.crawledUrls = [];
    this.allowedDomains = [];
    this.options = defaults(options, defaultOptions);

    // Add the initial URL's domain to the allowed domains
    const parsedUrl = new UrlParser(this.url);
    this.allowCrawlingForDomain(parsedUrl.host);

    // Add other configured allowed domains
    if (isArray(this.options.allowedDomains)) {
      this.options.allowedDomains.forEach(this.allowCrawlingForDomain.bind(this));
    }

    // Binds an async queue to the runTask method
    this.crawlingQueue = async.queue(this.runTask.bind(this), this.options.concurrency);
  }

  /**
   * Adds a domain to the list of allowed domains to crawl. URLs found
   * with a domain not in this list will be requested, but not
   * crawled for more URLs.
   * @param {string} domain
   */
  allowCrawlingForDomain(domain) {
    if (this.allowedDomains.indexOf(domain) < 0) {
      this.allowedDomains.push(domain);
    }
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
    if (this.allowedDomains.indexOf(parsedUrl.host) === -1) {
      return false;
    }

    return this.crawledUrls.indexOf(uri) === -1;
  }

  /**
   * Starts the crawling process by adding the main URL to the queue to be crawled.
   */
  start() {
    return this.addToQueue(new Task(this.url));
  }

  /**
   * Adds a URL to the queue to be crawled
   * @param {Task} task The task to add to the queue
   */
  addToQueue(task) {
    this.queued++;
    return this.crawlingQueue.push(task);
  }

  /**
   * The main crawl handler for the async crawl process
   */
  runTask(task, callback) {
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
        Referer: task.meta.parentUrl,
        'User-Agent': self.options.userAgent,
      },
    };

    request
      .get(requestOptions, (err, response, body) => {
        if (err || (response && response.statusCode >= 400)) {
          self.emit('error', task.url, task.meta.parentUrl, err, response);
          self.completed++;
          callback(err);

          if (self.queued - self.completed === 0) {
            self.emit('complete');
          }

          return;
        } else {
          self.emit('success', task.url, task.meta.parentUrl || 'base', response);
        }

        // Prevent crawling if we shouldn't
        if (self.shouldCrawl(response)) {
          self.emit('crawl', task.url);

          const $ = cheerio.load(body);
          const baseHref = $('base').attr('href');

          $('a[href], link[href]').each((index, el) => {
            var href = $(el).attr('href');
            if (isEmpty(href)) {
              return;
            }
            self.handleFoundUrl({
              foundAtUrl: task.url,
              url: href,
              baseHref,
              depth: task.meta.depth++,
            });
          });

          $('img[src], script[src]').each((index, el) => {
            var src = $(el).attr('src');
            if (isEmpty(src)) {
              return;
            }
            self.handleFoundUrl({
              foundAtUrl: task.url,
              url: src,
              baseHref,
              depth: task.meta.depth++,
            });
          });
        }

        // Add this to the list of crawled URLs
        self.crawledUrls.push(task.url);

        self.completed++;
        callback();
        if (self.queued - self.completed === 0) {
          self.emit('complete');
        }
      })
      .setMaxListeners(0);
  }

  /**
   * Resolves an absolute or relative URL into an absolute URL
   *
   * @param {string} url An absolute or relative url
   * @param {string} foundAtUrl The url at which this URL was found
   */
  resolveUrl(options) {
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
   * @param {object} options { url, parentUrl, depth }
   */
  handleFoundUrl(options) {
    const found = this.resolveUrl(options);

    // Only allow http and https URLs
    if (found.indexOf('http') < 0) {
      return;
    }

    this.emit('found', found, options.foundAtUrl);
    this.foundUrls.push(found);

    this.addToQueue(
      new Task(found, {
        parentUrl: options.foundAtUrl,
        depth: options.depth,
      })
    );
  }
}
