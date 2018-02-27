const Crawler = require('../../lib/crawler')
const TextOutputHandler = require('../../lib/output-handlers/text-output-handler')

const PORT = '5252'

describe('crawler', function () {
  before((done) => {
    global.server.start(() => {
      console.log('Server listening to', global.server.port)
      done()
    })
  })

  after((done) => {
    global.server.stop()
    done()
  })

  it('should be able to execute a test', function (done) {
    new Crawler({
      url: 'http://localhost:' + PORT
    })
      .registerOutputHandler(new TextOutputHandler({
        title: 'test'
      }))
      .on('complete', done)
      .start()
  })
})
