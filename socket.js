module.exports = (io, mongoose, jwt) => {
  const User = mongoose.model('User');
  const Message = mongoose.model('Message');
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('مستخدم متصل:', socket.id);

    socket.on('join-room', async ({ token, roomName }) => {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        const dbUser = await User.findOne({ username: user.username });
        
        if (dbUser.muted || dbUser.banned) {
          socket.emit('error', 'أنت مكتوم أو محظور');
          return;
        }
        
        socket.user = user;
        socket.room = roomName;
        socket.join(roomName);
        onlineUsers.set(socket.id, user);

        const oldMsgs = await Message.find({ room: roomName })
          .sort({ time: -1 }).limit(50);
        socket.emit('old-messages', oldMsgs.reverse());

        socket.to(roomName).emit('system', `${user.username} دخل الغرفة`);

        const usersInRoom = Array.from(onlineUsers.values())
          .filter(u => u.room === roomName);
        io.to(roomName).emit('users-list', usersInRoom);
        
      } catch (e) {
        socket.emit('error', 'فشل التحقق');
      }
    });

    socket.on('send-message', async ({ text }) => {
      if (!socket.user || !socket.room) return;
      if (text.length > 500) return;
      
      const msg = await Message.create({
        user: socket.user.username,
        rank: socket.user.rank,
        color: socket.user.color,
        room: socket.room,
        text
      });
      
      io.to(socket.room).emit('new-message', msg);
    });

    socket.on('disconnect', () => {
      if (socket.user && socket.room) {
        socket.to(socket.room).emit('system', `${socket.user.username} خرج`);
        onlineUsers.delete(socket.id);
        io.to(socket.room).emit('users-list', 
          Array.from(onlineUsers.values()).filter(u => u.room === socket.room)
        );
      }
    });
  });
};
