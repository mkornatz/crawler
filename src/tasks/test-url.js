import request from 'request-promise-native';
import Task from '../task';
import CrawlUrl from './crawl-url';

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
      url: self.url,
      encoding: 'utf8',
      followRedirect: true,
      followAllRedirects: true,
      rejectUnauthorized: false,
      resolveWithFullResponse: true,
      timeout: 5000,
      headers: {
        // 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        // 'Accept-Encoding': 'gzip, deflate, br',
        Referer: self.meta.parentUrl,
        'User-Agent': crawler.options.userAgent,
      },
    };

    // First, fetch only the headers for the URL to get the content type and status code (without downloading the body)
    let response;
    try {
      response = await request.head(requestOptions).setMaxListeners(0);
    } catch (error) {
      response = error.response;

      // If we're blocked with a "405 Method Not Allowed" when using HEAD, try a GET
      if (response && response.statusCode === 405) {
        try {
          response = await request.get(requestOptions).setMaxListeners(0);
        } catch (err) {
          response = err.response;
        }
      }

      if (response && response.statusCode >= 400) {
        crawler.emit('test.error', {
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

    crawler.emit('test.success', {
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
