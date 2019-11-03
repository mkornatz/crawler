import { createObjectCsvWriter } from 'csv-writer';
import { CrawlerEvents } from '../crawler';

/**
 * A console based output handler, which listens to events from crawler and displays results to the console.
 * @param {} options
 */
export default class CSVOutputHandler {
  constructor(crawler) {
    this.writer = createObjectCsvWriter({
      path: 'output.csv',
      header: [{ id: 'url', title: 'URL' }, { id: 'content-type', title: 'Content Type' }],
    });
    crawler
      .on(CrawlerEvents.URL_TEST_SUCCESS, this.testSuccess.bind(this))
      .on(CrawlerEvents.URL_TEST_ERROR, this.testError.bind(this));
  }

  async testSuccess({ url, response }) {
    await this.writer.writeRecords({
      url: url,
      'content-type': response.header['content-type'],
    });
  }

  testError({ url, parentUrl, error, response }) {}
}
