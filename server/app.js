const express = require('express');
const app = express();
const path = require('path');
const clientPath = path.join(__dirname,'..','client')
app.use(express.static(clientPath));
app.use(express.json());
module.exports = app;
