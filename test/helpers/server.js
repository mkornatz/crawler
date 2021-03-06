const StaticServer = require('static-server');
const path = require('path');
import Crawler from '../../src/crawler';

export const serverPort = 5252;
export const baseUrl = `http://localhost:${serverPort}`;

/**
 * Creates a new instance of a crawler for the test server
 * @param {string} path relative path of entry url
 */
export const crawlerForTestServer = (path, options = {}) => {
  return new Crawler(`${baseUrl}/${path}`, options);
};

export const startServer = templatePath => {
  global.server = new StaticServer({
    rootPath: path.join(__dirname, '../templates/', templatePath),
    port: serverPort,
  });

  global.server.start();

  return global.server;
};

export const stopServer = () => {
  global.server.stop();

  return global.server;
};
