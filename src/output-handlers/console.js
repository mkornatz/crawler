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
      .on('httpSuccess', this.httpSuccess.bind(this))
      .on('httpError', this.httpError.bind(this))
      .on('urlFound', this.urlFound.bind(this))
      .on('crawl', this.crawl.bind(this));
  }

  // Handles "success" event
  httpSuccess(url, parentUrl, res) {
    this.counts.success++;
    this.logger.ok(
      `${url} (HTTP ${res.statusCode}) ${res.headers['content-type']} ${res.headers['content-length']} bytes`
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

  // Handles "error" event
  httpError(url, parentUrl, err, res) {
    this.counts.errors++;
    if (_.isEmpty(res)) {
      this.logger.error('Response is empty. ', err);
    } else {
      this.logger.error(`(HTTP ${res.statusCode}) ${url} (found at ${parentUrl})`);
    }
  }

  // Handles "found" event
  urlFound(url, parentUrl) {
    this.counts.found++;
    // this.logger.found(`${url} (at ${parentUrl})`);
  }

  // Handles "crawl" event
  crawl(url) {
    this.counts.crawled++;
    this.logger.crawl(`Crawling ${url}`);
  }
}
