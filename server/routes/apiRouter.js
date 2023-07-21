var express = require('express');
var csMarket = require('./csMarket.js');
var app = express();

app.use('/csmarket', csMarket);

module.exports = app;
