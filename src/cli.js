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
  .option('-c, --csvPath <outfile>', 'CSV Output Filepath', null)
  .action(async (url, cmd) => {
    const crawler = new Crawler(url, {
      depth: cmd.depth || 0,
      concurrency: cmd.concurrency || 10,
      crawlDomains: cmd.domains || [],
    });

    // Add an output handler that listens to crawler events
    const outputHandler = new ConsoleOutputHandler(crawler);

    if (cmd.csvPath) {
      const csvOutputHandler = new CsvOutputHandler(crawler, cmd.csvPath);
    }

    await crawler.run();

    outputHandler.summarize();

    if (cmd.csvPath && typeof csvOutputHandler !== 'undefined') {
      csvOutputHandler.summarize();
    }
  })
  .parse(process.argv);
