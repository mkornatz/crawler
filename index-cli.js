#! /usr/bin/env node
process.env['NODE_OPTIONS'] = '--http-parser=legacy';
require = require('esm')(module /*, options*/);
module.exports = require('./src/cli');
