const command = require('commander')
const Crawler = require('./app/services/crawler.js')
const TextLogger = require('./app/services/loggers/text.js')

function list(val) {
  return val.split(',');
}

command
  .version('1.0.0')
  .usage('<site>')
  .option('-d, --domains <domains>', 'A list of domains to include in crawling', list)
  //.option('-i, --images', 'Whether to include images in the report')
  //.option('-t, --titles', 'List all page titles that are found')
  //.option('-f, --format <format>', 'Output format', 'text')
  .action(function(site, cmd){
    new Crawler({
      url: site,
      concurrency: 10,
      domains: cmd.domains,
      outputHandler: new TextLogger({
        title: site
      })
    }).start()
  })
  .parse(process.argv)
