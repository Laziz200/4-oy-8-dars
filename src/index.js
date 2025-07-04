const express = require('express');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT} portida ishlayapti`));