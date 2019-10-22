import { startServer, stopServer } from '../helpers/server';
import { crawlAndExpectUrlMatches } from '../helpers/crawl-and-expect-url-matches';

describe('<script>', () => {
  before(() => {
    startServer('simple-site');
  });
  after(stopServer);

  it('finds URLs in src attributes of <script> tags', async () => {
    await crawlAndExpectUrlMatches('with_base_href.html', /\.js/, 1);
  });
});
