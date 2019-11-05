import { createObjectCsvWriter } from 'csv-writer';
import { CrawlerEvents } from '../crawler';

/**
 * A console based output handler, which listens to events from crawler and displays results to the console.
 * @param {} options
 */
export default class CSVOutputHandler {
  constructor(crawler, outfilePath) {
    this.writer = createObjectCsvWriter({
      path: outfilePath,
      header: [
        { id: 'url', title: 'URL' },
        { id: 'content-type', title: 'Content Type' },
        { id: 'found-on', title: 'Found On' },
        { id: 'http-status', title: 'HTTP Status' },
        { id: 'size', title: 'Size' },
        { id: 'crawl-depth', title: 'Crawl Depth' },
      ],
    });

    crawler
      .on(CrawlerEvents.URL_TEST_SUCCESS, this.writeRecord.bind(this))
      .on(CrawlerEvents.URL_TEST_ERROR, this.writeRecord.bind(this));
  }

  writeRecord({ url, parentUrl, error, response, depth }) {
    return this.writer.writeRecords([
      {
        url: url,
        'found-on': parentUrl,
        'content-type': response ? response.headers['content-type'] : null,
        'http-status': response ? response.status : null,
        size: response ? response.headers['content-length'] : null,
        'crawl-depth': depth,
        error,
      },
    ]);
  }
}
