import { crawlerForTestServer } from './server';

export const crawlAndExpectUrlMatches = async (path, match, count) => {
  const crawler = crawlerForTestServer(path);
  let numMatches = 0;

  crawler.on('crawl.urlFound', ({ url }) => {
    if (url.match(match)) {
      numMatches++;
    }
  });
  await crawler.run();

  expect(numMatches).to.eq(count);
};
