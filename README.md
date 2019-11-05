# Crawler

A website crawler library with a built-in CLI tool to help expose bad URLs on a page or site.

> Note: This project is still in beta stage. It is not yet available as a stable package.

## Using the CLI Tool

```bash
cd path/to/crawler && npm install && npm link
crawl https://example.com
```

## Using as a library

```bash
npm install --save crawler
```

```javascript
import { Crawler, CrawlerEvents } from 'crawler';

const crawler = new Crawler('https://example.com', {
  depth: 0,
  concurrency: 10,
});

crawler.on(CrawlerEvents.URL_FOUND, ({ url, parentUrl }) => {
  console.log(`${url} was found on page ${parentUrl}`);
});

await crawler.run();
```

### Crawler Events

The Crawler class is an inheritor of the EventEmitter class. You can attach listeners to wait for a number of events
with the `on()` method.

- `URL_TEST_SUCCESS` - A URL was successfully tested (HTTP 200-399 response)
- `URL_TEST_ERROR` - A URL failed to load (HTTP 400+ response)
- `NOW_CRAWLING` - The crawler is beginning to crawl a new URL
- `CRAWL_ERROR` - The crawler encountered an error while trying to crawl a URL
- `URL_FOUND` - A URL was found while crawling a page

## Developing

```bash
npm install
```

## Testing

This uses Mocha and Chai with the `expect` syntax. To run tests:

```bash
npm t
```

## Known Issues

### Response Parsing Error

Node 12 introduced a new http-parser which is stricter when it comes to parsing HTTP responses. This causes some URLs to
trigger an error when parsing the response. For the time being, you need to pass an extra node option to work around
this issue:

```
NODE_OPTIONS="--http-parser=legacy" crawl https://example.com
```
