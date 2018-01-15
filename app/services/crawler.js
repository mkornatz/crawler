/**
 * Based on https://github.com/yusukeshibata/site-crawler (License MIT)
 */
const async = require('async')
const request = require('request')
const cheerio = require('cheerio')
const url = require('url')
const UrlParser = require('url-parse')
const EventEmitter = require('events').EventEmitter
const _ = require('lodash')

const Crawler = function(options) {
  const self = this
  options = _.defaults(options, {
    concurrency: 10,
    url: null,
    domains: [],
    outputHandler: null
  })

  if (_.isEmpty(options.url)) {
    throw new Error('URL must be defined for crawler');
  }

  if (_.isEmpty(options.outputHandler)) {
    throw new Error('Output handler must be used');
  }

  self.outputHandler = options.outputHandler

  self.concurrency = options.concurrency
  self.url = options.url
  self.domains = options.domains

  // Add the url domain
  const parsedUrl = new UrlParser(self.url)
  self.domains.push(parsedUrl.host)

  self.queued = 0
  self.completed = 0
  self.found = []

  self.crawler = async.queue(self._task.bind(self), self.concurrency)
  self.emitter = new EventEmitter()

  shouldCrawl = function(urlString) {
    if (urlString.indexOf('http://') < 0 && urlString.indexOf('https://') < 0) {
      return false
    }
    const parsedUrl = new UrlParser(urlString)

    return _.findIndex(self.domains, function(domain) { return domain == parsedUrl.host; }) > -1
  }

  self.defaultFoundHandler = function(foundUrl, next) {
    next(shouldCrawl(foundUrl) ? foundUrl : null)
  }

  self.defaultCrawlHandler = function(url, res, $, next) {
    next()
  }

  self.emitter.on('found', self.defaultFoundHandler)
  self.emitter.on('crawl', self.defaultCrawlHandler)

  self.outputHandler.register(self)
}

Crawler.prototype = _.extend(Crawler.prototype, {
  /**
   * Set on handler
   */
  on(type, listener) {
    if (type === 'found') this.emitter.removeListener(type, this.defaultFoundHandler)
    if (type === 'crawl') this.emitter.removeListener(type, this.defaultCrawlHandler)
    this.emitter.on(type, listener)
    return this
  },

  /**
   *
   */
  start() {
    var self = this
    self.queued = 1
    self.crawler.push({
      uri: self.url
    })
  },

  /**
   *
   */
  _task(task, callback) {
    var self = this
    request.get(task.uri, function(err, res, body) {
      if (err || res.statusCode !== 200) {
        self.emitter.emit('error', task.uri, err||res)
        self.completed++
        callback(err)

        if(self.queued - self.completed === 0) {
          self.emitter.emit('complete')
        }

        return
      } else {
        self.emitter.emit('success', task.uri, res)
      }

      self.emitter.emit('crawl', task.uri, res, body, function() {
        // If more HTML, follow it
        if (res.headers['content-type'] && res.headers['content-type'].indexOf('html')) {
          var $ = cheerio.load(body)

          $('a').each(function(index, a) {
            var href = $(a).attr('href')
            if(_.isEmpty(href)) {
              return
            }
            self._enqueueUri(task.uri, href);
          })

          $('img').each(function(index, img) {
            var src = $(img).attr('src')
            if(_.isEmpty(src)) {
              return
            }
            self._enqueueUri(task.uri, src);
          })
        }

        self.completed++
        callback()
        if (self.queued - self.completed === 0) {
          self.emitter.emit('complete')
        }
      })
    })
    .setMaxListeners(0)
  },

  /**
   *
   */
  _enqueueUri(uri, urlFound) {
    const self = this

    let parsedUrl;
    if (urlFound.indexOf('/') === 0) {
      parsedUrl = new UrlParser(url.resolve(uri, urlFound))
    } else {
      parsedUrl = new UrlParser(urlFound)
    }

    const found = [parsedUrl.protocol, '//', parsedUrl.host, parsedUrl.pathname].join('')

    if(self.found.indexOf(found) >= 0) {
      return
    }

    self.emitter.emit('found', found, function(found) {
      if (!found) {
        return
      }
      self.queued++
      self.found.push(found)

      self.crawler.push({
        uri: found
      })
    })
  }
})

module.exports = Crawler
