const express = require("express");
const { createStreak, getUserStreaks, updateTodayStreak } = require("../controllers/streak");
const { isUserLoggedIn } = require("../middleware/auth");
const router = express.Router();

// Create new streak
router.post("/create", isUserLoggedIn, createStreak);

// Get user's streaks
router.get("/list", isUserLoggedIn, getUserStreaks);

// Mark today's streak as completed
router.post("/complete-today", isUserLoggedIn, updateTodayStreak);

module.exports = router;
