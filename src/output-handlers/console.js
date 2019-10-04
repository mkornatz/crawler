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
      .on('success', this.success.bind(this))
      .on('error', this.error.bind(this))
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
  summarize() {
    this.logger.status('Finished crawling all URLs.');
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
    this.logger.found(`${url} (at ${foundAtUrl})`);
  }

  // Handles "crawl" event
  crawl(url) {
    this.logger.crawl(`Crawling ${url}`);
  }
}
