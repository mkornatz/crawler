import command from 'commander';
import Crawler from './crawler';
import ConsoleOutputHandler from './output-handlers/console';
import CsvOutputHandler from './output-handlers/csv';
import { csvToArray } from './utils/string';

command
  .version('1.0.0')
  .usage('<url>')
  .option('-c, --concurrency <number>', 'number of crawler threads to allow concurrently', parseInt)
  .option('-d, --depth <number>', 'how many pages deep to crawl (0 = no limit)', parseInt)
  .option('--domains <domains>', 'comma-separated list of domains to allow in crawling', csvToArray)
  .option('-c, --csv', 'Output results to a csv')
  .action(async (url, cmd) => {
    const crawler = new Crawler(url, {
      depth: cmd.depth || 0,
      concurrency: cmd.concurrency || 10,
      crawlDomains: cmd.domains || [],
    });

    const outputHandlers = {
      console: new ConsoleOutputHandler(crawler),
      csv: cmd.csv ? new CsvOutputHandler(crawler) : null,
    };

    await crawler.run();

    outputHandlers.forEach(handler => (handler ? handler.summarize() : null));
  })
  .parse(process.argv);
