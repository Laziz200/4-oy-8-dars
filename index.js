const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

const USERS_FILE = './users.json';
const POSTS_FILE = './posts.json';

const readData = async (file) => {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const writeData = async (file, data) => {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ xabar: 'Kirish tokeni talab qilinadi' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ xabar: 'Noto‘g‘ri token' });
    req.user = user;
    next();
  });
};

const userController = {
  royxatdanOtish: async (req, res) => {
    try {
      const { username, password, email } = req.body;
      const users = await readData(USERS_FILE);
      
      if (users.find(u => u.username === username || u.email === email)) {
        return res.status(400).json({ xabar: 'Foydalanuvchi yoki email allaqachon mavjud' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: users.length ? users[users.length - 1].id + 1 : 1,
        username,
        password: hashedPassword,
        email
      };
      
      users.push(user);
      await writeData(USERS_FILE, users);
      res.status(201).json({ xabar: 'Foydalanuvchi muvaffaqiyatli yaratildi' });
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  kirish: async (req, res) => {
    try {
      const { username, password } = req.body;
      const users = await readData(USERS_FILE);
      const user = users.find(u => u.username === username);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ xabar: 'Noto‘g‘ri ma’lumotlar' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, 
        process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  foydalanuvchiOlish: async (req, res) => {
    try {
      const users = await readData(USERS_FILE);
      const user = users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ xabar: 'Foydalanuvchi topilmadi' });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  foydalanuvchiYangilash: async (req, res) => {
    try {
      const { username, email } = req.body;
      const users = await readData(USERS_FILE);
      const userIndex = users.findIndex(u => u.id === req.user.id);
      
      if (userIndex === -1) return res.status(404).json({ xabar: 'Foydalanuvchi topilmadi' });
      
      users[userIndex] = { ...users[userIndex], username, email };
      await writeData(USERS_FILE, users);
      const { password, ...updatedUser } = users[userIndex];
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  foydalanuvchiOchirish: async (req, res) => {
    try {
      const users = await readData(USERS_FILE);
      const filteredUsers = users.filter(u => u.id !== req.user.id);
      
      if (filteredUsers.length === users.length) {
        return res.status(404).json({ xabar: 'Foydalanuvchi topilmadi' });
      }
      
      await writeData(USERS_FILE, filteredUsers);
      res.json({ xabar: 'Foydalanuvchi muvaffaqiyatli o‘chirildi' });
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  }
};

const postController = {
  postYaratish: async (req, res) => {
    try {
      const { sarlavha, matn } = req.body;
      const posts = await readData(POSTS_FILE);
      
      const post = {
        id: posts.length ? posts[posts.length - 1].id + 1 : 1,
        sarlavha,
        matn,
        muallif: req.user.id,
        yaratilganVaqt: new Date().toISOString()
      };
      
      posts.push(post);
      await writeData(POSTS_FILE, posts);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  postlarniOlish: async (req, res) => {
    try {
      const posts = await readData(POSTS_FILE);
      const users = await readData(USERS_FILE);
      
      const populatedPosts = posts.map(post => ({
        ...post,
        muallif: { id: post.muallif, username: users.find(u => u.id === post.muallif)?.username }
      }));
      
      res.json(populatedPosts);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  postOlish: async (req, res) => {
    try {
      const posts = await readData(POSTS_FILE);
      const users = await readData(USERS_FILE);
      const post = posts.find(p => p.id === parseInt(req.params.id));
      
      if (!post) return res.status(404).json({ xabar: 'Post topilmadi' });
      
      const populatedPost = {
        ...post,
        muallif: { id: post.muallif, username: users.find(u => u.id === post.muallif)?.username }
      };
      
      res.json(populatedPost);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  postYangilash: async (req, res) => {
    try {
      const { sarlavha, matn } = req.body;
      const posts = await readData(POSTS_FILE);
      const users = await readData(USERS_FILE);
      const postIndex = posts.findIndex(p => p.id === parseInt(req.params.id));
      
      if (postIndex === -1) return res.status(404).json({ xabar: 'Post topilmadi' });
      if (posts[postIndex].muallif !== req.user.id) {
        return res.status(403).json({ xabar: 'Ruxsat yo‘q' });
      }

      posts[postIndex] = {
        ...posts[postIndex],
        sarlavha: sarlavha || posts[postIndex].sarlavha,
        matn: matn || posts[postIndex].matn
      };
      
      await writeData(POSTS_FILE, posts);
      const populatedPost = {
        ...posts[postIndex],
        muallif: { id: posts[postIndex].muallif, username: users.find(u => u.id === posts[postIndex].muallif)?.username }
      };
      
      res.json(populatedPost);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  postOchirish: async (req, res) => {
    try {
      const posts = await readData(POSTS_FILE);
      const postIndex = posts.findIndex(p => p.id === parseInt(req.params.id));
      
      if (postIndex === -1) return res.status(404).json({ xabar: 'Post topilmadi' });
      if (posts[postIndex].muallif !== req.user.id) {
        return res.status(403).json({ xabar: 'Ruxsat yo‘q' });
      }

      posts.splice(postIndex, 1);
      await writeData(POSTS_FILE, posts);
      res.json({ xabar: 'Post muvaffaqiyatli o‘chirildi' });
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  }
};

const userRouter = express.Router();
userRouter.post('/royxatdan-otish', userController.royxatdanOtish);
userRouter.post('/kirish', userController.kirish);
userRouter.get('/profil', authenticateToken, userController.foydalanuvchiOlish);
userRouter.put('/profil', authenticateToken, userController.foydalanuvchiYangilash);
userRouter.delete('/profil', authenticateToken, userController.foydalanuvchiOchirish);

const postRouter = express.Router();
postRouter.post('/', authenticateToken, postController.postYaratish);
postRouter.get('/', postController.postlarniOlish);
postRouter.get('/:id', postController.postOlish);
postRouter.put('/:id', authenticateToken, postController.postYangilash);
postRouter.delete('/:id', authenticateToken, postController.postOchirish);

app.use('/api/foydalanuvchilar', userRouter);
app.use('/api/postlar', postRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT} portida ishlayapti`));