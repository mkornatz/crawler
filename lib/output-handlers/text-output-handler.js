import winston from 'winston';
import _ from 'lodash';

/**
 * A text based output handler, which listens to events from crawler and displays results to the console.
 * @param {} options
 */
export class TextOutputHandler {
  constructor(options) {
    this.options = _.extend(
      {
        title: null,
      },
      options
    );

    winston.addColors({
      ok: 'blue',
      status: 'yellow',
      error: 'red',
    });

    this.logger = new winston.Logger({
      levels: {
        ok: 0,
        status: 1,
        error: 2,
      },
      transports: [new winston.transports.Console({ level: 'error', colorize: true })],
    });

    this.logger.status('Crawl Log for', this.options.title, '...');
  }

  // Registers the output handler with the crawler instance
  register(crawler) {
    crawler
      .on('success', this.success.bind(this))
      .on('error', this.error.bind(this))
      .on('complete', this.complete.bind(this))
      .on('found', this.found.bind(this))
      .on('crawl', this.crawl.bind(this));
  }

  // Handles "success" event
  success(url, parentUrl, res) {
    this.logger.ok(url, '[' + parentUrl + ']', res.headers['content-type'], res.headers['content-length'], 'bytes');
  }

  // Handles "complete" event
  complete() {
    this.logger.status('finished crawling all URLs.');
  }

  // Handles "error" event
  error(url, parentUrl, err, res) {
    if (_.isEmpty(res)) {
      this.logger.error('Response is empty', err);
    } else {
      this.logger.error('[', res.statusCode, ']', url, '[' + parentUrl + ']');
    }
  }

  // Handles "found" event
  found(url, foundAtUrl) {
    // this.logger.status(`found ${url} at ${foundAtUrl}`)
  }

  // Handles "crawl" event
  crawl(url) {
    // this.logger.status('crawling', url)
  }
}
