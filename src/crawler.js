import async from 'async';
import request from 'request';
import cheerio from 'cheerio';
import { EventEmitter } from 'events';
import { defaults, isArray, isEmpty } from 'lodash';
import Task from './task';
import Store from './store';
import { absoluteUrl, getDomainFromUrl } from './utils/url';

const defaultOptions = {
  concurrency: 10,
  depth: 0,
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

    super(); // Must call for 'this' to be defined

    this.store = new Store({
      testedUrls: [],
      crawledUrls: [],
    });

    this.url = absoluteUrl({ url });
    this.options = defaults(options, defaultOptions);
    this.allowedDomains = [];

    // Add the initial URL's domain to the allowed domains
    this.allowCrawlingForDomain(getDomainFromUrl(this.url));

    // Add other configured allowed domains
    if (isArray(this.options.allowedDomains)) {
      this.options.allowedDomains.forEach(this.allowCrawlingForDomain.bind(this));
    }

    // Binds an async queue to the runTask method
    this.crawlingQueue = async.queue(this.runTask.bind(this), this.options.concurrency);
  }

  /**
   * Starts the crawling process by adding the main URL to the queue to be crawled.
   * @return Promise that will resolve when the queue has finished
   */
  run() {
    this.addToQueue(new Task(this.url));
    return this.crawlingQueue.drain();
  }

  /**
   * Adds a domain to the list of allowed domains to crawl. URLs found
   * with a domain not in this list will be requested, but not
   * crawled for more URLs.
   * @param {string} domain
   */
  allowCrawlingForDomain(domain) {
    if (!this.domainAllowedForCrawling(domain)) {
      this.allowedDomains.push(domain);
    }
  }

  /**
   * Determines if a domain is allowed to be crawled
   * @param {string} domain
   */
  domainAllowedForCrawling(domain) {
    return this.allowedDomains.indexOf(domain) >= 0;
  }

  /**
   * Determines if url should be crawled based on domain
   * @param  {Response} response object
   * @return {bool}
   */
  shouldCrawl(res) {
    const uri = absoluteUrl({
      url: res.request.uri.href,
    });

    // only crawl pages if the scheme is http(s)
    if (uri.indexOf('http://') < 0 && uri.indexOf('https://') < 0) {
      return false;
    }
    // don't crawl pages that aren't html
    if (res.headers['content-type'] && res.headers['content-type'].indexOf('html') < 0) {
      return false;
    }

    // Is domain allowed to be crawled?
    if (!this.domainAllowedForCrawling(getDomainFromUrl(uri))) {
      return false;
    }

    // Have we already crawled?
    return this.store.doesNotContain('crawledUrls', uri);
  }

  /**
   * Adds a URL to the queue to be crawled
   * @param {Task} task The task to add to the queue
   */
  addToQueue(task) {
    return this.crawlingQueue.push(task);
  }

  /**
   * The main crawl handler for the async crawl process
   */
  runTask(task, next) {
    var self = this;

    // Have we already tested this URL?
    if (self.store.contains('testedUrls', task.url) || self.store.mutexIsSet(task.url)) {
      return next();
    }

    // We store URLs in progress to avoid race conditions
    self.store.setMutexFlag(task.url);

    const requestOptions = {
      url: task.url,
      encoding: 'utf8',
      followRedirect: true,
      followAllRedirects: true,
      rejectUnauthorized: false,
      timeout: 5000,
      headers: {
        // 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        // 'Accept-Encoding': 'gzip, deflate, br',
        Referer: task.meta.parentUrl,
        'User-Agent': self.options.userAgent,
      },
    };

    // First, fetch only the headers for the URL to get the content type and status code (without downloading the body)
    request.head(requestOptions, (err, response) => {
      // Add this to the list of tested URLs
      self.store.push('testedUrls', task.url);

      // Clear mutex since we've now added it to testedUrls
      self.store.clearMutexFlag(task.url);

      if (err || (response && response.statusCode >= 400)) {
        self.emit('httpError', task.url, task.meta.parentUrl, err, response);
        return next();
      }

      self.emit('httpSuccess', task.url, task.meta.parentUrl || 'base', response);

      // If the URL serves HTML and we should crawl it
      if (
        response.headers['content-type'] &&
        response.headers['content-type'].indexOf('html') >= 0 &&
        self.shouldCrawl(response) &&
        (self.options.depth <= 0 || (self.options.depth > 0 && task.meta.depth < self.options.depth))
      ) {
        request
          .get(requestOptions, (err, response, body) => {
            if (err) {
              self.emit('httpError', task.url, task.meta.parentUrl, err);
              next(err);
              return;
            } else if (response.statusCode >= 400) {
              self.emit('httpError', task.url, task.meta.parentUrl, response);
              next();
              return;
            }

            self.emit('crawl', task.url);

            // Add this to the list of crawled URLs prior to crawling to avoid race conditions
            self.store.push('crawledUrls', task.url);

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
                depth: task.meta.depth + 1,
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
                depth: task.meta.depth + 1,
              });
            });

            next();
          })
          .setMaxListeners(0);

        // Non-HTML, or we shouldn't crawl it
      } else {
        next();
      }
    });
  }

  /**
   * Emits a `found` event which can determine whether or not the url
   * should be crawled.
   * @param {object} options { url, parentUrl, depth }
   */
  handleFoundUrl(options) {
    const found = absoluteUrl(options);

    // Only allow http and https URLs
    if (found.indexOf('http') < 0) {
      return;
    }

    this.emit('urlFound', found, options.foundAtUrl);

    this.addToQueue(
      new Task(found, {
        parentUrl: options.foundAtUrl,
        depth: options.depth,
      })
    );
  }
}
