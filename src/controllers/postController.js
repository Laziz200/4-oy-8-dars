const { v4: uuidv4 } = require('uuid');

const posts = [];

const postController = {
  createPost: async (req, res) => {
    try {
      const { sarlavha, matn } = req.body;
      const post = {
        id: uuidv4(),
        sarlavha,
        matn,
        muallif: req.user.id,
        yaratilganVaqt: new Date()
      };
      posts.push(post);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  getPosts: async (req, res) => {
    try {
      const users = require('./userController').users; 
      const populatedPosts = posts.map(post => ({
        ...post,
        muallif: users.find(u => u.id === post.muallif)?.username || "Nomalum"
      }));
      res.json(populatedPosts);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  getPost: async (req, res) => {
    try {
      const post = posts.find(p => p.id === req.params.id);
      if (!post) return res.status(404).json({ xabar: 'Post topilmadi' });
      const users = require('./userController').users;
      const populatedPost = {
        ...post,
        muallif: users.find(u => u.id === post.muallif)?.username || "Nomalum"
      };
      res.json(populatedPost);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  updatePost: async (req, res) => {
    try {
      const { sarlavha, matn } = req.body;
      const postIndex = posts.findIndex(p => p.id === req.params.id);
      
      if (postIndex === -1) return res.status(404).json({ xabar: 'Post topilmadi' });
      if (posts[postIndex].muallif !== req.user.id) {
        return res.status(403).json({ xabar: 'Ruxsat yo‘q' });
      }

      posts[postIndex] = {
        ...posts[postIndex],
        sarlavha: sarlavha || posts[postIndex].sarlavha,
        matn: matn || posts[postIndex].matn
      };
      const users = require('./userController').users;
      const populatedPost = {
        ...posts[postIndex],
        muallif: users.find(u => u.id === posts[postIndex].muallif)?.username || "Nomalum"
    };
        res.json(populatedPost);
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const postIndex = posts.findIndex(p => p.id === req.params.id);
      
      if (postIndex === -1) return res.status(404).json({ xabar: 'Post topilmadi' });
      if (posts[postIndex].muallif !== req.user.id) {
        return res.status(403).json({ xabar: 'Ruxsat yo‘q' });
      }

      posts.splice(postIndex, 1);
      res.json({ xabar: 'Post muvaffaqiyatli o‘chirildi' });
    } catch (error) {
      res.status(400).json({ xabar: error.message });
    }
  }
};

module.exports = postController;
module.exports.posts = posts; 