import { crawlerForTestServer } from './server';
import { CrawlerEvents } from '../../src/crawler';

export const crawlAndExpectUrlMatches = async (path, match, count) => {
  const crawler = crawlerForTestServer(path);
  let numMatches = 0;

  crawler.on(CrawlerEvents.URL_FOUND, ({ url }) => {
    if (url.match(match)) {
      numMatches++;
    }
  });
  await crawler.run();

  expect(numMatches).to.eq(count);
};
