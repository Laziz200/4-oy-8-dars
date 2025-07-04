const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const users = [];

const userController = {
  register: async (req, res) => {
    try {
      const { username, password, email } = req.body;
      
      if (users.find(u => u.username === username)) {
        return res.status(400).json({ xabar: 'Username allaqachon mavjud' });
      }
      if (users.find(u => u.email === email)) {
        return res.status(400).json({ xabar: 'Email allaqachon mavjud' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: uuidv4(),
        username,
        password: hashedPassword,
        email
      };
      users.push(user);
      res.status(201).json({ xabar: 'Foydalanuvchi muvaffaqiyatli yaratildi' });
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
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

  getUser: async (req, res) => {
    try {
      const user = users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ xabar: 'Foydalanuvchi topilmadi' });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { username, email } = req.body;
      const userIndex = users.findIndex(u => u.id === req.user.id);
      
      if (userIndex === -1) return res.status(404).json({ xabar: 'Foydalanuvchi topilmadi' });
      
      if (username && users.some(u => u.username === username && u.id !== req.user.id)) {
        return res.status(400).json({ xabar: 'Username allaqachon mavjud' });
      }
      if (email && users.some(u => u.email === email && u.id !== req.user.id)) {
        return res.status(400).json({ xabar: 'Email allaqachon mavjud' });
      }

      users[userIndex] = {
        ...users[userIndex],
        username: username || users[userIndex].username,
        email: email || users[userIndex].email
      };
      const { password, ...userWithoutPassword } = users[userIndex];
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userIndex = users.findIndex(u => u.id === req.user.id);
      if (userIndex === -1) return res.status(404).json({ xabar: 'Foydalanuvchi topilmadi' });
      users.splice(userIndex, 1);
      res.json({ xabar: 'Foydalanuvchi muvaffaqiyatli o‘chirildi' });
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  }
};

module.exports = userController;