import axios from 'axios';
import Task from '../task';
import CrawlUrl from './crawl-url';
import { CrawlerEvents } from '../crawler';

export default class TestUrl extends Task {
  async run(crawler, next) {
    const self = this;

    // Have we already tested this URL?
    if (crawler.store.contains('testedUrls', self.url) || crawler.store.mutexIsSet(self.url)) {
      return next();
    }

    // We store URLs in progress to avoid race conditions
    crawler.store.setMutexFlag(self.url);

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

    // First, fetch only the headers for the URL to get the content type and status code (without downloading the body)
    let response;
    try {
      response = await httpInstance.head(self.url);
    } catch (error) {
      if (error.response === undefined) {
        crawler.emit(CrawlerEvents.URL_TEST_ERROR, {
          url: self.url,
          parentUrl: self.meta.parentUrl,
          error,
        });
        return next();
      }

      response = error.response;

      // If we're blocked with a "405 Method Not Allowed" when using HEAD, try a GET
      if (response && response.status === 405) {
        try {
          response = await httpInstance.get(self.url);
        } catch (err) {
          response = err.response;
        }
      }

      if (response && response.status >= 400) {
        crawler.emit(CrawlerEvents.URL_TEST_ERROR, {
          url: self.url,
          parentUrl: self.meta.parentUrl,
          response,
        });
        return next();
      }
    }

    // Add this to the list of tested URLs
    crawler.store.push('testedUrls', self.url);

    // Clear mutex since we've now added it to testedUrls
    crawler.store.clearMutexFlag(self.url);

    crawler.emit(CrawlerEvents.URL_TEST_SUCCESS, {
      url: self.url,
      parentUrl: self.meta.parentUrl || 'base',
      response,
    });

    if (crawler.shouldCrawl(response, this)) {
      crawler.addToQueue(
        new CrawlUrl(self.url, {
          depth: self.depth,
          parentUrl: self.parentUrl,
        })
      );
    }

    next();
  }
}
