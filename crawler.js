const command = require('commander')
const Crawler = require('./lib/crawler.js')
const TextOutputHandler = require('./lib/output-handlers/text-output-handler.js')

function list (val) {
  return val.split(',')
}

command
  .version('1.0.0')
  .usage('<site>')
  .option('-d, --domains <domains>', 'A list of domains to include in crawling', list)
  // .option('-i, --images', 'Whether to include images in the report')
  // .option('-f, --format <format>', 'Output format', 'text')
  .action(function (site, cmd) {
    new Crawler({
      url: site,
      concurrency: 10,
      crawlDomains: cmd.domains
    })
      .registerOutputHandler(new TextOutputHandler({
        title: site
      }))
      .start()
  })
  .parse(process.argv)
