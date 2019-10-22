import { startServer, stopServer } from '../helpers/server';
import { crawlAndExpectUrlMatches } from '../helpers/crawl-and-expect-url-matches';

describe('<link>', () => {
  before(() => {
    startServer('simple-site');
  });
  after(stopServer);

  it('finds URLs in src attributes of <link> tags', async () => {
    await crawlAndExpectUrlMatches('with_base_href.html', /\.css/, 1);
  });
});
