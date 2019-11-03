import _ from 'lodash';
import { CrawlerEvents } from '../crawler';

/**
 * A console based output handler, which listens to events from crawler and displays results to the console.
 * @param {} options
 */
export default class CSVOutputHandler {
  constructor(crawler) {
    crawler
      .on(CrawlerEvents.URL_TEST_SUCCESS, this.testSuccess.bind(this))
      .on(CrawlerEvents.URL_TEST_ERROR, this.testError.bind(this));
  }

  testSuccess({ url, response }) {}

  testError({ url, parentUrl, error, response }) {}
}
