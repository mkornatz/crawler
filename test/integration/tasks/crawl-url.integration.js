import { startServer, stopServer, crawlerForTestServer } from '../../helpers/server';
import { crawlAndExpectUrlMatches } from '../../helpers/crawl-and-expect-url-matches';

describe('CrawlUrl Task', () => {
  before(() => {
    startServer('simple-site');
  });
  after(stopServer);

  it('finds urls in src attributes of <img> tags', async () => {
    await crawlAndExpectUrlMatches('with_base_href.html', /\.(gif|png|jpg)/, 2);
  });

  it('finds URLs in href attributes of <link> tags', async () => {
    await crawlAndExpectUrlMatches('with_base_href.html', /\.css/, 1);
  });

  it('finds URLs in src attributes of <script> tags', async () => {
    await crawlAndExpectUrlMatches('with_base_href.html', /\.js/, 1);
  });

  it('finds and tests image URLs', async () => {
    const crawler = crawlerForTestServer('image_url_only.html');
    crawler.on('crawl.urlFound', ({ url }) => {
      expect(url).to.match(/should-not-be-crawled\.png/);
    });
    crawler.on('test.success', ({ url }) => {
      expect(url).to.match(/should-not-be-crawled\.png/);
    });
    await crawler.run();
  });
});
