const express = require('express');
const cors = require('cors');
const migrate = require('./migrate');
const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');

const app = express();

app.use(cors({
  origin: 'https://kosiclement7-collab.github.io'
}));
app.use(express.json());

app.get('/', (req, res) => res.send('Dashboard API is running.'));

app.use('/api/auth', authRoutes);
app.use('/api', entriesRoutes);

const PORT = process.env.PORT || 3000;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Migration failed, starting server anyway:', err);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
