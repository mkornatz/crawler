import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { startServer, stopServer, crawlerForTestServer, baseUrl } from '../../helpers/server';
import { CrawlerEvents } from '../../../src/crawler';

chai.use(sinonChai);

describe('TestUrl Task', () => {
  let server;

  beforeEach(() => {
    server = startServer('simple-site');
  });
  afterEach(stopServer);

  it('tries a GET after a 405 Method Not Allowed', async () => {
    let numResponses = 0;

    // TODO: Use a stub for the first response to mock a 405
    server.on('response', (req, res) => {
      if (numResponses === 0) {
        res.status = 405;
        res.statusCode = 405;
        numResponses++;
      }
    });

    const crawler = crawlerForTestServer('page_url_only.html', { depth: 1 });

    const spySuccess = sinon.spy();
    const spyError = sinon.spy();

    crawler.on(CrawlerEvents.URL_TEST_SUCCESS, spySuccess);
    crawler.on(CrawlerEvents.URL_TEST_ERROR, spyError);

    await crawler.run();

    expect(spySuccess).to.have.been.calledOnce;
    expect(spyError).not.to.have.been.called;
  });

  it("doesn't crawl pages that have 404'd", async () => {
    const crawler = crawlerForTestServer('page_with_404_link.html', { depth: 2 });

    const crawlSpy = sinon.spy();
    crawler.on(CrawlerEvents.NOW_CRAWLING, crawlSpy);

    const foundSpy = sinon.spy();
    crawler.on(CrawlerEvents.URL_FOUND, foundSpy);

    await crawler.run();

    expect(crawlSpy).not.to.have.been.calledWith({
      url: `${baseUrl}/does-not-exist.html`,
    });
    expect(foundSpy).to.have.been.calledWith({
      parentUrl: `${baseUrl}/page_with_404_link.html`,
      url: `${baseUrl}/does-not-exist.html`,
    });
  });

  it('does not crawl image URLs', async () => {
    const crawler = crawlerForTestServer('image_url_only.html');
    crawler.on(CrawlerEvents.NOW_CRAWLING, url => {
      expect(url).not.to.match(/should-not-be-crawled\.png/);
    });
    await crawler.run();
  });
});
