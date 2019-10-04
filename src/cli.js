import command from 'commander';
import Crawler from './crawler';
import ConsoleOutputHandler from './output-handlers/console';
import { csvToArray } from './utils/string';

command
  .version('1.0.0')
  .usage('<url>')
  .option('-c, --concurrency <number>', 'number of crawler threads to allow concurrently', parseInt)
  .option('-d, --depth <number>', 'how many pages deep to crawl', parseInt)
  .option('--domains <domains>', 'comma-separated list of domains to allow in crawling', csvToArray)
  // .option('-i, --images', 'Whether to include images in the report')
  // .option('-f, --format <format>', 'Output format', 'text')
  .action(function(url, cmd) {
    const crawler = new Crawler(url, {
      concurrency: cmd.concurrency || 10,
      crawlDomains: cmd.domains || [],
    });

    // Add an output handler that listens to crawler events
    new ConsoleOutputHandler(crawler);

    crawler.start();
  })
  .parse(process.argv);
