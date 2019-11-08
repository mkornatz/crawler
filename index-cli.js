#! /usr/bin/env node --http-parser=legacy
require = require('esm')(module /*, options*/);
module.exports = require('./src/cli');
