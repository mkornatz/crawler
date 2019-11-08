import command from 'commander';
import Crawler from './crawler';
import ConsoleOutputHandler from './output-handlers/console';
import { csvToArray } from './utils/string';

command
  .version('1.0.0')
  .usage('<url>')
  .option('-c, --concurrency <number>', 'number of crawler threads to allow concurrently', parseInt)
  .option('-d, --depth <number>', 'how many pages deep to crawl (0 = no limit)', parseInt)
  .option('--domains <domains>', 'comma-separated list of domains to allow in crawling', csvToArray)
  // .option('-i, --images', 'Whether to include images in the report')
  // .option('-f, --format <format>', 'Output format', 'text')
  .action(async (url, cmd) => {
    try {
      const crawler = new Crawler(url, {
        depth: cmd.depth || 0,
        concurrency: cmd.concurrency || 10,
        crawlDomains: cmd.domains || [],
      });

      // Add an output handler that listens to crawler events
      const outputHandler = new ConsoleOutputHandler(crawler);

      await crawler.run();

      outputHandler.summarize();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  })
  .parse(process.argv);
