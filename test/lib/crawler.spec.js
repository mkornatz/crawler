const Crawler = require("../../lib/crawler");

const baseUrl = "http://localhost:5252";

describe("crawler", function() {
  before(done => {
    global.server.start(() => {
      console.log("Test server listening on", global.server.port);
      done();
    });
  });

  after(done => {
    global.server.stop();
    done();
  });

  it("starts", function(done) {
    new Crawler({
      url: baseUrl + "/pages/with_base_href.html"
    })
      .on("error", () => {})
      .on("complete", done)
      .start();
  });
});
