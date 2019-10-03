import command from 'commander';
import Crawler from './src/crawler';
import ConsoleOutputHandler from './src/output-handlers/console';

function list(val) {
  return val.split(',');
}

command
  .version('1.0.0')
  .usage('<url>')
  .option('-d, --domains <domains>', 'A comma-separated list of domains to include in crawling', list)
  // .option('-i, --images', 'Whether to include images in the report')
  // .option('-f, --format <format>', 'Output format', 'text')
  .action(function(url, cmd) {
    const crawler = new Crawler({
      url,
      concurrency: 10,
      crawlDomains: cmd.domains || [],
    });

    // Add an output handler that listens to crawler events
    new ConsoleOutputHandler(crawler);

    crawler.start();
  })
  .parse(process.argv);
