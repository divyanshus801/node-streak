const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');


const authRoutes = require('./routes/auth');
const streakRoutes = require("./routes/streak");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/streak', streakRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
