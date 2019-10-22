import request from 'request-promise-native';
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
      url: self.url,
      encoding: 'utf8',
      followRedirect: true,
      followAllRedirects: true,
      rejectUnauthorized: false,
      resolveWithFullResponse: true,
      timeout: 5000,
      gzip: true,
      headers: {
        // 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: self.meta.parentUrl,
        'User-Agent': crawler.options.userAgent,
      },
    };

    try {
      const response = await request.get(requestOptions).setMaxListeners(0);
      const body = response.body;

      crawler.emit(CrawlerEvents.NOW_CRAWLING, {
        url: self.url,
      });

      // Add this to the list of crawled URLs prior to crawling to avoid race conditions
      crawler.store.push('crawledUrls', self.url);

      const $ = cheerio.load(body);
      const baseHref = $('base').attr('href');

      $('a[href], link[href]').each((index, el) => {
        var href = $(el).attr('href');
        if (isEmpty(href)) {
          return next();
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
          return next();
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
    if (found.indexOf('http') < 0) {
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
