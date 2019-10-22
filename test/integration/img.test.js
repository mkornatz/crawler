import { startServer, stopServer, crawlerForTestServer } from '../helpers/server';
import { crawlAndExpectUrlMatches } from '../helpers/crawl-and-expect-url-matches';

describe('<img>', () => {
  before(() => {
    startServer('simple-site');
  });
  after(stopServer);

  it('finds urls in src attributes of <img> tags', async () => {
    await crawlAndExpectUrlMatches('with_base_href.html', /\.(gif|png|jpg)/, 2);
  });

  it('finds and checks image URLs', async () => {
    const crawler = crawlerForTestServer('image_url_only.html');
    crawler.on('urlFound', ({ url }) => {
      expect(url).to.match(/\.png/);
    });
    crawler.on('httpSuccess', ({ url }) => {
      expect(url).to.match(/(\.png|image_url_only.html)/);
    });
    await crawler.run();
  });

  it('does not crawl image URLs', async () => {
    const crawler = crawlerForTestServer('image_url_only.html');
    crawler.on('crawl', url => {
      expect(url).not.to.match(/\.png/);
    });
    await crawler.run();
  });
});
