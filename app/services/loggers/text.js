const winston = require('winston')
const _ = require('lodash')

const levelsAndColors = {
  levels: {
    ok: 0,
    status: 1,
    error: 2
  },
  colors: {
    ok: 'blue',
    status: 'yellow',
    error: 'red'
  }
};

winston.addColors(levelsAndColors.colors);

const TextLogger = function(options) {
  this.options = _.extend({
    title: null,
  }, options)

  this.logger = new (winston.Logger)({
    levels: levelsAndColors.levels,
    transports: [
      new (winston.transports.Console)({ level: 'error', colorize: true })
    ]
  });

  this.logger.status('Crawl Log for ', this.options.title, '...')
}

TextLogger.prototype = _.extend(TextLogger.prototype, {
  register(crawler) {
    var self = this;

    crawler
      .on('success', (url, res) => {
        self.success(url, res)
      })
      .on('error', (url, err) => {
        self.error(url, err)
      })
      .on('complete', () => {
        self.complete()
      })
  },
  success(uri, res) {
    this.logger.ok(uri)
  },
  complete() {
    this.logger.status('done.')
  },
  error(url, err) {
    this.logger.error('[', err.statusCode, ']', url)
  }
})

module.exports = TextLogger
