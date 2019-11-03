import axios from 'axios';
import cheerio from 'cheerio';
import { isEmpty } from 'lodash';
import Task from '../task';
import TestUrl from './test-url';
import { absoluteUrl } from '../utils/url';
import { CrawlerEvents } from '../crawler';

export default class CrawlUrl extends Task {
  async run(crawler, next) {
    const self = this;
    self.crawler = crawler;

    const requestOptions = {
      responseEncoding: 'utf8',
      maxRedirects: 10,
      timeout: 5000,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: self.meta.parentUrl,
        'User-Agent': crawler.options.userAgent,
      },
    };

    const httpInstance = axios.create(requestOptions);

    try {
      const response = await httpInstance.get(self.url);
      const body = response.data;

      crawler.emit(CrawlerEvents.NOW_CRAWLING, {
        url: self.url,
      });

      // Add this to the list of crawled URLs prior to crawling to avoid race conditions
      crawler.store.push('crawledUrls', self.url);

      const $ = cheerio.load(body);
      const baseHref = $('base').attr('href');

      $('a[href], link[href]').each((index, el) => {
        var href = $(el).attr('href');
        if (isEmpty(href) || $(el).attr('rel') == 'dns-prefetch') {
          return;
        }
        self.handleFoundUrl({
          foundAtUrl: self.url,
          url: href,
          baseHref,
          depth: self.meta.depth + 1,
        });
      });

      $('img[src], script[src]').each((index, el) => {
        var src = $(el).attr('src');
        if (isEmpty(src)) {
          return;
        }
        self.handleFoundUrl({
          foundAtUrl: self.url,
          url: src,
          baseHref,
          depth: self.meta.depth + 1,
        });
      });
    } catch (error) {
      crawler.emit(CrawlerEvents.CRAWL_ERROR, {
        url: self.url,
        parentUrl: self.meta.parentUrl,
        error,
      });
    }

    next();
  }

  /**
   * Emits a `found` event which can determine whether or not the url
   * should be crawled.
   * @param {object} options { url, parentUrl, depth }
   */
  handleFoundUrl({ foundAtUrl, url, baseHref, depth }) {
    const found = absoluteUrl({ foundAtUrl, url, baseHref });

    // Only allow http and https URLs
    if (found.indexOf('http') !== 0) {
      return;
    }

    this.crawler.emit(CrawlerEvents.URL_FOUND, {
      url: found,
      parentUrl: foundAtUrl,
    });

    this.crawler.addToQueue(
      new TestUrl(found, {
        parentUrl: foundAtUrl,
        depth: depth,
      })
    );
  }
}
