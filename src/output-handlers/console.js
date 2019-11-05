import winston from 'winston';
import _ from 'lodash';
import { CrawlerEvents } from '../crawler';

/**
 * A console based output handler, which listens to events from crawler and displays results to the console.
 * @param {} options
 */
export default class ConsoleOutputHandler {
  constructor(crawler) {
    this.counts = {
      found: 0,
      tested: 0,
      crawled: 0,
      success: 0,
      errors: 0,
    };
    const logLevelsAndColors = {
      levels: {
        ok: 0,
        crawl: 1,
        found: 1,
        status: 1,
        error: 2,
      },
      colors: {
        ok: 'blue',
        crawl: 'green',
        found: 'yellow',
        status: 'white',
        error: 'red',
      },
    };

    winston.addColors(logLevelsAndColors);

    this.logger = new winston.createLogger({
      levels: logLevelsAndColors.levels,
      transports: [
        new winston.transports.Console({
          level: 'error',
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      ],
    });

    crawler
      .on(CrawlerEvents.URL_TEST_SUCCESS, this.testSuccess.bind(this))
      .on(CrawlerEvents.URL_TEST_ERROR, this.testError.bind(this))
      .on(CrawlerEvents.URL_FOUND, this.urlFound.bind(this))
      .on(CrawlerEvents.NOW_CRAWLING, this.crawlStart.bind(this));
  }

  // Handles "test.success" event
  testSuccess({ url, response }) {
    this.counts.success++;
    if (response.headers['content-length']) {
      this.logger.ok(
        `${url} (HTTP ${response.status}) ${response.headers['content-type']} ${
          response.headers['content-length']
        } bytes`
      );
    } else {
      this.logger.ok(`${url} (HTTP ${response.status}) ${response.headers['content-type']}`);
    }
  }

  // Handles "complete" event
  summarize() {
    this.logger.status(
      `Finished.\n\n
      Pages Crawled: ${this.counts['crawled']}
      URLs Found (incl duplicates): ${this.counts['found']}
      URLs Tested: ${this.counts['success']}
      Errors: ${this.counts['errors']}
      `
    );
  }

  // Handles "test.error" event
  testError({ url, parentUrl, error, response }) {
    this.counts.errors++;
    if (_.isEmpty(response)) {
      this.logger.error(`${error}: ${url}`);
    } else {
      this.logger.error(`(HTTP ${response.status}) ${url} (found at ${parentUrl})`);
    }
  }

  // Handles "found" event
  urlFound() {
    this.counts.found++;
    // this.logger.found(`${url} (at ${parentUrl})`);
  }

  // Handles "crawl.start" event
  crawlStart({ url }) {
    this.counts.crawled++;
    this.logger.crawl(`Crawling ${url}`);
  }
}
