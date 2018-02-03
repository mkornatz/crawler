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
}

winston.addColors(levelsAndColors.colors)

const TextOutputHandler = function (options) {
  this.options = _.extend({
    title: null
  }, options)

  this.logger = new (winston.Logger)({
    levels: levelsAndColors.levels,
    transports: [
      new (winston.transports.Console)({ level: 'error', colorize: true })
    ]
  })

  this.logger.status('Crawl Log for ', this.options.title, '...')
}

TextOutputHandler.prototype = _.extend(TextOutputHandler.prototype, {
  register (crawler) {
    crawler
      .on('success', this.success.bind(this))
      .on('error', this.error.bind(this))
      .on('complete', this.complete.bind(this))
  },
  success (uri, res) {
    this.logger.ok(uri)
  },
  complete () {
    this.logger.status('done.')
  },
  error (url, err, res, parentUrl) {
    this.logger.error('[', err.statusCode, ']', url)
  }
})

module.exports = TextOutputHandler
