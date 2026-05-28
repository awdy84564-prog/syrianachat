const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e6
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/syrianachat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60
});
app.use('/api/', limiter);

require('./models')(mongoose);
require('./routes')(app, mongoose, bcrypt, jwt);
require('./socket')(io, mongoose, jwt);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SYRIANACHAT شغال على المنفذ: ${PORT}`);
});
