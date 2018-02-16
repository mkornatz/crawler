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

  this.logger.status('Crawl Log for', this.options.title, '...')
}

TextOutputHandler.prototype = _.extend(TextOutputHandler.prototype, {
  register (crawler) {
    crawler
      .on('success', this.success.bind(this))
      .on('error', this.error.bind(this))
      .on('complete', this.complete.bind(this))
      .on('found', this.found.bind(this))
      .on('crawl', this.crawl.bind(this))
  },
  success (url, parentUrl, res) {
    this.logger.ok(url, '[' + parentUrl + ']', res.headers['content-type'], res.headers['content-length'], 'bytes')
  },
  complete () {
    this.logger.status('finished crawling all URLs.')
  },
  error (url, parentUrl, err, res) {
    if (_.isEmpty(res)) {
      this.logger.error('Response is empty', err)
    } else {
      this.logger.error('[', res.statusCode, ']', url, '[' + parentUrl + ']')
    }
  },
  found (url, foundAtUrl) {
    // this.logger.status(`found ${url} at ${foundAtUrl}`)
  },
  crawl (url) {
    // this.logger.status('crawling', url)
  }
})

module.exports = TextOutputHandler
