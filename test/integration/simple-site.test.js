import { startServer, stopServer, crawlerForTestServer } from '../helpers/server';
import { crawlAndExpectUrlMatches } from '../helpers/crawl-and-expect-url-matches';

describe('simple-site', function() {
  before(() => {
    startServer('simple-site');
  });
  after(stopServer);

  describe('finds different types of URLs', () => {
    it('<img>', async () => {
      await crawlAndExpectUrlMatches('with_base_href.html', /\.(gif|png|jpg)/, 2);
    });

    it('<link>', async () => {
      await crawlAndExpectUrlMatches('with_base_href.html', /\.css/, 1);
    });

    it('<script>', async () => {
      await crawlAndExpectUrlMatches('with_base_href.html', /\.js/, 1);
    });
  });

  it('should not crawl non-html URLs', async () => {
    const crawler = crawlerForTestServer('image_url_only.html');
    crawler.on('crawl', url => {
      expect(url).not.to.match(/\.png/);
    });
    await crawler.run();
  });
});
