module.exports = (app, mongoose, bcrypt, jwt) => {
  const User = mongoose.model('User');
  const Room = mongoose.model('Room');
  
  const ranks = {
    'زائر': '#888',
    'عضو': '#00ff00',
    'مشرف': '#0088ff',
    'مدير': '#ff8800',
    'مالك': '#ff0000'
  };

  app.post('/api/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.json({ err: 'املأ كل الحقول' });
      if (username.length < 3) return res.json({ err: 'الاسم قصير جداً' });
      
      const exists = await User.findOne({ username });
      if (exists) return res.json({ err: 'الاسم مستخدم مسبقاً' });
      
      const hash = await bcrypt.hash(password, 10);
      await User.create({ username, password: hash, color: ranks['عضو'] });
      
      res.json({ ok: true, msg: 'تم التسجيل بنجاح' });
    } catch (e) {
      res.json({ err: 'خطأ في السيرفر' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      
      if (!user) return res.json({ err: 'المستخدم غير موجود' });
      if (user.banned) return res.json({ err: 'أنت محظور' });
      if (!await bcrypt.compare(password, user.password)) return res.json({ err: 'كلمة السر خاطئة' });
      
      user.lastSeen = new Date();
      await user.save();
      
      const token = jwt.sign(
        { id: user._id, username: user.username, rank: user.rank, color: user.color },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ token, rank: user.rank, color: user.color, username: user.username });
    } catch (e) {
      res.json({ err: 'خطأ في السيرفر' });
    }
  });

  app.get('/api/rooms', async (req, res) => {
    const rooms = await Room.find().limit(20);
    res.json(rooms);
  });

  app.post('/api/create-room', async (req, res) => {
    const { token, name, password } = req.body;
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      if (user.rank !== 'مدير' && user.rank !== 'مالك') return res.json({ err: 'ليس لديك صلاحية' });
      
      await Room.create({ name, owner: user.username, password });
      res.json({ ok: true });
    } catch (e) {
      res.json({ err: 'خطأ' });
    }
  });
};
