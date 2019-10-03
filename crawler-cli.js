import command from 'commander';
import Crawler from './src/crawler';
import ConsoleOutputHandler from './src/output-handlers/console';
import { csvToArray } from './src/utils/string';

command
  .version('1.0.0')
  .usage('<url>')
  .option('-d, --domains <domains>', 'comma-separated list of domains to allow in crawling', csvToArray)
  .option('-c, --concurrency <integer>', 'number of crawler threads to allow concurrently', parseInt)
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
