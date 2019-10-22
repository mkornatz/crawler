# Crawler

A website crawler library with a built-in CLI tool to help expose bad URLs on a page or site.

> Note: This project is still in beta stage. It is not yet available as a stable package.

## Install

```bash
npm install
```

## Using as a library

```bash
npm install --save crawler
```

```javascript
import Crawler from 'crawler';

const crawler = new Crawler('https://example.com', {
  depth: 0,
  concurrency: 10,
});

crawler.on('crawl.urlFound', ({url, parentUrl}) => {
  console.log(`${url} was found on page ${parentUrl}`);
});

await crawler.run();
```

### Crawler Events

- `test.success` - Fires when a URL was successfully loaded (HTTP 200-399 response)
- `test.error` - Fires when a URL fails to load (HTTP 400+ response)
- `crawl.start` - Fires when the crawler is beginning to crawl a URL
- `crawl.error` - Fires when the crawler errors when trying to crawl a URL
- `crawl.urlFound` - Fires when a URL was found in parsing a page

## Using the CLI Tool

```bash
cd path/to/crawler && npm link
crawl https://example.com
```

## Testing

This uses Mocha and Chai with the `expect` syntax. To run tests:

```bash
npm t
```

## Similar projects

- https://github.com/antivanov/js-crawler
- https://github.com/yusukeshibata/site-crawler
