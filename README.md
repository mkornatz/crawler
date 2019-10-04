# Crawler

A website crawler library with a built-in CLI tool to help expose bad URLs on a page or site.

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

The crawler instance fires off events to be handled by the output handler, which can handle the display of events, a summary of the crawl, etc.

- `found` - Fires when a URL was found in parsing a page
- `success` - Fires when a URL was successfully loaded (HTTP 200-399 response)
- `error` - Fires when a URL fails to load (HTTP 400+ response)
- `crawl` - Fires when the crawler is beginning to crawl a URL

```js
crawler
  .on('success', (url, parentUrl, response) => {
    console.log(`${url} was succcessfully loaded on ${parentUrl}`);
  })
  .on('error', (url, parentUrl, err, response) => {
    console.log(`${url} failed to load on ${parentUrl}`, err);
  })
  .on('found', (url, parentUrl) => {
    console.log(`${url} was found on ${parentUrl} but not yet requested or crawled`);
  })
  .on('crawl', url => {
    console.log(`beginning to crawl ${url}`);
  });
```

## Testing

This uses Mocha and Chai with the `expect` syntax. To run tests:

```bash
npm test
```

## TODO

- Use `Accept-Encoding: gzip, deflate, br` to mimic browser (LinkedIn 999 error)
- Handle UTF8 chars in URLs

## Similar projects

- https://github.com/antivanov/js-crawler
- https://github.com/yusukeshibata/site-crawler
