require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const createError = require('http-errors');
const rateLimit = require('express-rate-limit');

//route path
const userRoute = require('./routes/userRoute');
const postRoute = require('./routes/postRoute');
const friendRequestRoute = require('./routes/friendRequestRoute');
const friendshipRoute = require('./routes/friendshipRoute');
const followerRoute = require('./routes/followerRoute');
const commentRoute = require('./routes/commentRoute');
const likeRoute = require('./routes/likeRoute');
const messageRoute = require('./routes/messageRoute');
const notificationRoute = require('./routes/notificationRoute');

// initialize express
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// server port
const port = process.env.PORT || 8000;

// middlewares
app.set('trust proxy', 1);
// app.get('/ip', (req, res) => res.send(req.ip));
app.use(cookieParser());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(logger('dev'));
}
app.use(
  session({
  
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, maxAge: 1 * 60 * 60 * 1000, httpOnly: true },
  })
);

//static path
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

//routes
app.use('/users', limit, userRoute);
app.use('/posts', postRoute);
app.use('/friendships', friendshipRoute);
app.use('/followers', followerRoute);
app.use('/comments', commentRoute);
app.use('/likes', likeRoute);
app.use('/messages', messageRoute);
app.use('/notifications', notificationRoute);

// app.use('/friend-requests', friendRequestRoute);

// app.get('/*', function (req, res) {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

const postUsers = [];
// const

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  //User
  socket.on('user-join', (room, name) => {
    socket.join(room);
    console.log(`${name} joined user room ${room}`);
  });

  socket.on('notifications', (room, name) => {
    socket.join(room);
    console.log(`${name} joined notifications room ${room}`);
  });

  // socket.on('notications', (room, message) => {
  //   io.to(room).emit('chatMessage', message);
  // });

  //Chat
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`);
  });

  socket.on('chatMessage', (room, message) => {
    io.to(room).emit('chatMessage', message);
  });

  //Post
  socket.on('post-join', (room, name) => {
    socket.join(room);
    console.log(`${name} joined room ${room}`);
  });

  socket.on('post-comments', (room, { message, postee }) => {
    //  console.log(message, postee);
    io.to(room).emit('post-comments', message);

    //Send notication to the user who posted the article
    const noticationBody = {
      type: 'post-comment',
      id: room,
      message: `${message.user?.name} commented on your post!`,
    };

    //Check if postee equal to user
    io.to(postee).emit('notifications', noticationBody);
  });

  socket.on('disconnect', (reason) => {
    console.log('A user disconnected', reason);
  });
});

//error handlers
app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(err.status || 500).json(err.message);
  // .json('Error connecting to server.Please try connecting again!');

  // res.json({
  //   error: {
  //     status: err.status || 500,
  //     message: err.message,
  //   },
  // });
});

server.listen(port, () => console.log(`listening on port ${port}!`));
