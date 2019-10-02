# Crawler

A site crawler to expose crawling errors on a site.

## Install

```
npm install
```

## Run

```
node crawler.js https://example.com
```

## Events

- `found` - Fires when a URL was found in parsing a page
- `success` - Fires when a URL was successfully loaded (HTTP 200-399 response)
- `error` - Fires when a URL fails to load (HTTP 400+ response)
- `complete` - Fires when the crawling is finished
- `crawl` - Fires when the crawler is beginning to crawl a URL

```
crawler
  .on('success', (url, parentUrl, response) => {
    console.log(`${url} was succcessfully loaded on ${parentUrl}`)
    })
  .on('error', (url, parentUrl, err, response) => {
    console.log(`${url} failed to load on ${parentUrl}`, err)
    })
  .on('complete', () => {
    // all done
    })
  .on('found', (url, parentUrl) => {
    console.log(`${url} was found on ${parentUrl} but not yet requested or crawled`)
    })
  .on('crawl', (url) => {
    console.log(`beginning to crawl ${url}`)
    })
```

## Testing

This uses Mocha and Chai with the `expect` syntax. To run tests:

```
npm test
```

## TODO

- Use `Accept-Encoding: gzip, deflate, br` to mimic browser (LinkedIn 999 error)
- Handle UTF8 chars in URLs

## Similar projects

- https://github.com/antivanov/js-crawler
- https://github.com/yusukeshibata/site-crawler
