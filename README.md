# Crawler

A website crawler library with a built-in CLI tool to help expose bad URLs on a page or site.

> Note: This project is still in beta stage. It is not yet available as a stable package.

## Install

```bash
npm install && npm link
```

## Using the CLI Tool

```bash
crawl https://example.com
```

## Developing

### Output Handler

The crawler instance fires off events to be handled by the output handler, which can handle the display of events, a
summary of the crawl, etc.

- `test.success` - Fires when a URL was successfully loaded (HTTP 200-399 response)
- `test.error` - Fires when a URL fails to load (HTTP 400+ response)
- `crawl.start` - Fires when the crawler is beginning to crawl a URL
- `crawl.error` - Fires when the crawler errors when trying to crawl a URL
- `crawl.urlFound` - Fires when a URL was found in parsing a page

```js
crawler
  .on('test.success', ({ url, parentUrl, response }) => {
    console.log(`${url} was succcessfully loaded on ${parentUrl}`);
  })
  .on('test.error', ({ url, parentUrl, error, response }) => {
    console.log(`${url} failed to load on ${parentUrl}`, err);
  })
  .on('crawl.start', ({ url }) => {
    console.log(`beginning to crawl ${url}`);
  })
  .on('crawl.error', ({ url, parentUrl, error, response }) => {
    console.log(`${url} failed to be crawled`, err);
  })
  .on('crawl.urlFound', ({ url, parentUrl }) => {
    console.log(`${url} was found on ${parentUrl} but not yet requested or crawled`);
  });
```

## Testing

This uses Mocha and Chai with the `expect` syntax. To run tests:

```bash
npm test
```

## TODO

- Use `Accept-Encoding: gzip, deflate, br` to mimic browser (LinkedIn 999 error)

## Similar projects

- https://github.com/antivanov/js-crawler
- https://github.com/yusukeshibata/site-crawler
