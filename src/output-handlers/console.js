import winston from 'winston';
import _ from 'lodash';

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
      .on('test.success', this.testSuccess.bind(this))
      .on('test.error', this.testError.bind(this))
      .on('crawl.urlFound', this.urlFound.bind(this))
      .on('crawl.start', this.crawlStart.bind(this));
  }

  // Handles "test.success" event
  testSuccess({ url, parentUrl, response }) {
    this.counts.success++;
    this.logger.ok(
      `${url} (HTTP ${response.statusCode}) ${response.headers['content-type']} ${
        response.headers['content-length']
      } bytes`
    );
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
      this.logger.error('Response is empty. ', error);
    } else {
      this.logger.error(`(HTTP ${response.statusCode}) ${url} (found at ${parentUrl})`);
    }
  }

  // Handles "found" event
  urlFound({ url, parentUrl }) {
    this.counts.found++;
    // this.logger.found(`${url} (at ${parentUrl})`);
  }

  // Handles "crawl.start" event
  crawlStart({ url }) {
    this.counts.crawled++;
    this.logger.crawl(`Crawling ${url}`);
  }
}
