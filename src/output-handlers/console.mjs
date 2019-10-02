import winston from 'winston';
import _ from 'lodash';

/**
 * A console based output handler, which listens to events from crawler and displays results to the console.
 * @param {} options
 */
export default class ConsoleOutputHandler {
  constructor(crawler) {
    const logLevelsAndColors = {
      levels: {
        ok: 0,
        status: 1,
        error: 2,
      },
      colors: {
        ok: 'blue',
        status: 'yellow',
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
      .on('success', this.success.bind(this))
      .on('error', this.error.bind(this))
      .on('complete', this.complete.bind(this))
      .on('found', this.found.bind(this))
      .on('crawl', this.crawl.bind(this));
  }

  // Handles "success" event
  success(url, parentUrl, res) {
    this.logger.ok(
      `${url} (found at ${parentUrl}) ${res.headers['content-type']} ${res.headers['content-length']} bytes`
    );
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
      this.logger.error(`[${res.statusCode}] ${url} (found at ${parentUrl})`);
    }
  }

  // Handles "found" event
  found(url, foundAtUrl) {
    this.logger.status(`found URL ${url} at URL ${foundAtUrl}`);
  }

  // Handles "crawl" event
  crawl(url) {
    this.logger.status(`Starting to crawl ${url}`);
  }
}
