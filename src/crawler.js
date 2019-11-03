import async from 'async';
import { EventEmitter } from 'events';
import { defaults, isArray, isEmpty } from 'lodash';
import CrawlUrl from './tasks/crawl-url';
import Store from './store';
import { absoluteUrl, getDomainFromUrl } from './utils/url';
export * from './types';

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
   * Adds a URL to the queue to be crawled
   * @param {CrawlUrl} task The task to add to the queue
   */
  addToQueue(task) {
    return this.crawlingQueue.push(task);
  }

  /**
   * Starts the crawling process by adding the main URL to the queue to be crawled.
   * @return Promise that will resolve when the queue has finished
   */
  async run() {
    this.addToQueue(new CrawlUrl(this.url));
    await this.crawlingQueue.drain();
  }

  /**
   * Runs a task in the crawling queue
   */
  runTask(task, next) {
    task.run(this, next);
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
  shouldCrawl(res, task) {
    // Have we gone out of our depth?
    if (this.options.depth > 0) {
      if (task.meta.depth >= this.options.depth) {
        return false;
      }
    }

    // Only HTML should be crawled
    if (!res.headers['content-type'] || res.headers['content-type'].indexOf('html') < 0) {
      return false;
    }

    const uri = absoluteUrl({
      url: res.config.url,
    });

    // only crawl pages if the scheme is http(s)
    if (uri.indexOf('http://') < 0 && uri.indexOf('https://') < 0) {
      return false;
    }

    // Is domain allowed to be crawled?
    if (!this.domainAllowedForCrawling(getDomainFromUrl(uri))) {
      return false;
    }

    // Have we already crawled?
    return this.store.doesNotContain('crawledUrls', uri);
  }
}
