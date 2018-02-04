# Crawler
A site crawler to expose crawling errors on a site.

## Events

- `found` - Fires when a URL was found in parsing a page
- `crawl` - Fires after a page is parsed and before scraping for more URLs
- `success` - Fires when a URL was successfully loaded (HTTP 200-399 response)
- `error` - Fires when a URL fails to load (HTTP 400+ response)

```
crawler
  .on('success', (url, res) => {
    console.log(`${url} was succcessfully loaded`)
    })
  .on('error', (url, err, res) => {
    console.log(`${url} failed to load`)
    })
  .on('complete', () => {})
  .on('crawl', (url, res, $, next) => { next() })
  .on('found', (url, next) => { next() })
```

## Testing

This uses Mocha and Chai with the `expect` syntax. To run tests:

```
npm test
```


## TODO

- Use `Accept-Encoding: gzip, deflate, br` to mimic browser (LinkedIn 999 error)
- Handle UTF8 chars in URLs
- Utilize the baseUrl tags in pages


## Similar projects

- https://github.com/antivanov/js-crawler
- https://github.com/yusukeshibata/site-crawler
