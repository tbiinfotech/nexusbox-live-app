'use strict';
const path = require('path');
const fs = require('fs');
const sequelize = require('./db/db');
const socketIo = require('socket.io');

require('dotenv').config({
  path: __dirname + '/.env',
});
const bodyParser = require('body-parser');

// Set Global
global.appRoot = __dirname;

const express = require('express');
const cors = require('cors');

// initiate App with express module.
let app = express();
app.use(cors());

sequelize
  .sync()
  .then(() => console.log('Database connected successfully...'))
  .catch((err) => console.log('Error: ' + err));

console.log('server file');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Include Services API File
app.use(require('./src/Services'));
app.use(express.static(path.join(__dirname, './react/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './react/dist/index.html'));
});

/*** Create HTTP server. ***/
// const http_port = 3000;
// const httpServer = require('http').Server(app);
// httpServer.listen(http_port, function () {
//   console.log(`HTTP Server started on port ${http_port}`);
// });

let http_options = {};
let https = require('https');

http_options = {
  ...http_options,
  key: fs.readFileSync('../ssl/private.key'),
  cert: fs.readFileSync('../ssl/certificate.crt'),
  ca: [fs.readFileSync('../ssl/ca_bundle.crt')],
};

const https_port = process.env.HTTPS_PORT || '8006';
var httpsServer = https.createServer(http_options, app);
// const httpsServer = require("http").Server(app);
httpsServer.listen(443, () => {
  console.log(`httpsServer App started on port 443`);
});

// Initialize Socket.IO and attach it to the HTTP server
const io = socketIo(httpsServer, {
  cors: {
    origin: '*', // Allows connections from any origin
    methods: ['GET', 'POST'],
  },
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Emit a message back to the connected frontend to confirm connection
  socket.emit('connectionSuccess', { message: `Connected as developer ` });

  socket.on('messagetoserver', (data) => {
    console.log('Message from client:', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('socketio', io);
