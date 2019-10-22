import { startServer, stopServer, crawlerForTestServer } from '../helpers/server';
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

  it('Tries a GET after a 405 Method Not Allowed', async () => {
    // Mock a 405 response, and then a 200
    let numCalls = 0;

    server.on('response', (req, res) => {
      if (numCalls === 0) {
        res.status = 405;
        res.statusCode = 405;
        numCalls++;
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
});
