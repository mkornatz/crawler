const StaticServer = require('static-server')
const path = require('path')

global.server = new StaticServer({
  rootPath: path.join(__dirname, 'site'),
  port: 5252
})
