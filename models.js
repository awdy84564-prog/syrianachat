module.exports = (mongoose) => {
  const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    rank: { type: String, default: 'عضو' },
    color: { type: String, default: '#00ff00' },
    muted: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
  });

  const RoomSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    owner: String,
    password: String,
    maxUsers: { type: Number, default: 50 },
    createdAt: { type: Date, default: Date.now }
  });

  const MessageSchema = new mongoose.Schema({
    user: String,
    rank: String,
    color: String,
    room: String,
    text: String,
    time: { type: Date, default: Date.now },
    type: { type: String, default: 'chat' }
  });

  const BanSchema = new mongoose.Schema({
    username: String,
    reason: String,
    bannedBy: String,
    bannedAt: { type: Date, default: Date.now },
    expiresAt: Date
  });

  mongoose.model('User', UserSchema);
  mongoose.model('Room', RoomSchema);
  mongoose.model('Message', MessageSchema);
  mongoose.model('Ban', BanSchema);
};
