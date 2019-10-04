import Crawler from '../../src/crawler';

const baseUrl = 'http://localhost:5252';

describe('server', function() {
  before(done => {
    global.server.start(() => {
      // console.log('Test server listening on', global.server.port);
      done();
    });
  });

  after(done => {
    global.server.stop();
    done();
  });

  it('starts', async () => {
    const crawler = new Crawler(baseUrl + '/pages/with_base_href.html');
    return crawler.run();
  });
});
