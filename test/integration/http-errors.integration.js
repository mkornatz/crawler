import { startServer, stopServer, crawlerForTestServer, baseUrl } from '../helpers/server';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('HTTP errors', () => {
  let server;

  beforeEach(() => {
    server = startServer('simple-site');
  });
  afterEach(stopServer);

  it('tries a GET after a 405 Method Not Allowed', async () => {
    let numResponses = 0;

    // Mocks a 405 only for the first response
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

    crawler.on('test.success', spySuccess);
    crawler.on('test.error', spyError);

    await crawler.run();

    expect(spySuccess).to.have.been.calledOnce;
    expect(spyError).not.to.have.been.called;
  });

  it("doesn't crawl pages that have 404'd", async () => {
    const crawler = crawlerForTestServer('page_with_404_link.html', { depth: 2 });

    const crawlSpy = sinon.spy();
    crawler.on('crawl.start', crawlSpy);

    const foundSpy = sinon.spy();
    crawler.on('crawl.urlFound', foundSpy);

    await crawler.run();

    expect(crawlSpy).not.to.have.been.calledWith({
      url: `${baseUrl}/does-not-exist.html`,
    });
    expect(foundSpy).to.have.been.calledWith({
      parentUrl: `${baseUrl}/page_with_404_link.html`,
      url: `${baseUrl}/does-not-exist.html`,
    });
  });
});
