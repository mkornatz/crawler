/**
 * Based on https://github.com/yusukeshibata/site-crawler (License MIT)
 */
const async = require('async')
const request = require('request')
const cheerio = require('cheerio')
const Url = require('url')
const UrlParser = require('url-parse')
const EventEmitter = require('events').EventEmitter
const _ = require('lodash')

const Crawler = function (options) {
  const self = this

  self.options = _.defaults(options, {
    concurrency: 10,
    url: null,
    crawlDomains: []
  })

  if (_.isEmpty(self.options.url)) {
    throw new Error('You must specify a URL to crawl.')
  }

  // Add the url domain and other allowed domains to
  // be crawled
  const parsedUrl = new UrlParser(self.options.url)
  self.addDomainToCrawl(parsedUrl.host)
  self.options.crawlDomains.each(self.addDomainToCrawl)

  self.queued = 0
  self.completed = 0
  self.foundUrls = []

  self.crawler = async.queue(self._task.bind(self), self.options.concurrency)

  self.emitter = new EventEmitter()
  self.emitter.on('found', self._defaultFoundHandler.bind(self))
  self.emitter.on('crawl', self._defaultCrawlHandler.bind(self))
}

Crawler.prototype = _.extend(Crawler.prototype, {
  /**
   * Registers an output handler for the crawl to respond to events
   * @param  {OutputHandler} handler
   * @return {Crawler}
   */
  registerOutputHandler (handler) {
    handler.register(this)
    return this
  },

  /**
   *
   */
  addDomainToCrawl (domain) {
    this.domains.push(domain)
  },

  /**
   * Determins if url should be crawled based on domain
   * @param  {string} url
   * @return {bool}
   */
  shouldCrawl (url) {
    if (url.indexOf('http://') < 0 && url.indexOf('https://') < 0) {
      return false
    }
    const parsedUrl = new UrlParser(url)

    return _.findIndex(this.domains, (domain) => domain === parsedUrl.host) > -1
  },

  /**
   * Default handler for `found` event
   */
  _defaultFoundHandler (url, next) {
    next(this.shouldCrawl(url) ? url : null)
  },

  /**
   * Default handler for crawl event
   */
  _defaultCrawlHandler (url, res, $, next) {
    next()
  },

  /**
   * Sets a listener for an event
   */
  on (type, listener) {
    if (type === 'found') this.emitter.removeListener(type, this._defaultFoundHandler.bind(this))
    if (type === 'crawl') this.emitter.removeListener(type, this._defaultCrawlHandler.bind(this))
    this.emitter.on(type, listener)
    return this
  },

  /**
   * Starts the crawling process
   */
  start () {
    var self = this
    self.queued = 1
    self.crawler.push({
      url: self.options.url
    })
  },

  /**
   * The main handler for the async crawl process
   */
  _task (task, callback) {
    var self = this
    request.get(task.url, (err, res, body) => {
      if (err || res.statusCode >= 400) {
        self.emitter.emit('error', task.url, err, res)
        self.completed++
        callback(err)

        if (self.queued - self.completed === 0) {
          self.emitter.emit('complete')
        }

        return
      } else {
        self.emitter.emit('success', task.url, res)
      }

      self.emitter.emit('crawl', task.url, res, body, () => {
        // If more HTML, follow it
        if (res.headers['content-type'] && res.headers['content-type'].indexOf('html')) {
          var $ = cheerio.load(body)

          $('a[href], link[href]').each((index, a) => {
            var href = $(a).attr('href')
            if (_.isEmpty(href)) {
              return
            }
            self._handleFoundUrl({
              parentUrl: task.url,
              url: href
            })
          })

          $('img[src], script[src]').each((index, img) => {
            var src = $(img).attr('src')
            if (_.isEmpty(src)) {
              return
            }
            self._handleFoundUrl({
              parentUrl: task.url,
              url: src
            })
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
  _resolveUrl (urlToResolve, parentUrl) {
    let parsedUrl

    // If the url is relative, use the parent's url to resolve
    if (urlToResolve.indexOf('/') === 0) {
      parsedUrl = new UrlParser(Url.resolve(parentUrl, urlToResolve))
    } else {
      parsedUrl = new UrlParser(urlToResolve)
    }

    return [parsedUrl.protocol, '//', parsedUrl.host, parsedUrl.pathname].join('')
  },

  /**
   * Emits a `found` event which can determine whether or not the url
   * should be crawled.
   */
  _handleFoundUrl (options) {
    const found = this._resolveUrl(options.url, options.parentUrl)

    if (this.foundUrls.indexOf(found) >= 0) {
      return
    }

    this.emitter.emit('found', found, (shouldCrawl) => {
      if (!shouldCrawl) {
        return
      }
      this.queued++
      this.foundUrls.push(options.url)

      this.crawler.push({
        url: options.url,
        parentUrl: options.parentUrl
      })
    })
  }
})

module.exports = Crawler
