const express = require('express');
const { register, login } = require('../controllers/auth');

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);

module.exports = router;