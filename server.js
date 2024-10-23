'use strict';
const path = require('path');
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
const http_port = process.env.HTTP_PORT || 8007;
const httpServer = require('http').Server(app);
httpServer.listen(http_port, function () {
  console.log(`HTTP Server started on port ${http_port}`);
});

// Initialize Socket.IO and attach it to the HTTP server
const io = socketIo(httpServer, {
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
