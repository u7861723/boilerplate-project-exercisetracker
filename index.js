const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected Successfully!"))
.catch(err => {
  console.error("MongoDB Connection Error:", err);
  process.exit(1);
});

const User = require('./user');
// 新增用户
app.post('/api/users', async (req, res) => {
  const user = await User.create({ username: req.body.username });
  res.json({ username: user.username, _id: user._id });
});

// 获取所有用户
app.get('/api/users', async (req, res) => {
  const users = await User.find().select('_id username');
  res.json(users);
});

// 添加运动记录
app.post('/api/users/:id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const user = await User.findById(req.params.id);

  const exercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date()
  };

  user.log.push(exercise);
  await user.save();

  res.json({
    username: user.username,
    _id: user._id,
    description: description,
    duration: exercise.duration,
    date: new Date(date).toDateString()
  });
});

// 获取运动记录（支持日期过滤和数量限制）
app.get('/api/users/:id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findById(req.params.id);

  let logs = user.log;

  if (from) {
    logs = logs.filter(log => new Date(log.date) >= new Date(from));
  }
  if (to) {
    logs = logs.filter(log => new Date(log.date) <= new Date(to));
  }
  if (limit) {
    logs = logs.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: logs.map(e => ({
      description: e.description,
      duration: e.duration,
      date: new Date(e.date).toDateString()
    }))
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
