const express = require("express");
const { createStreak } = require("../controllers/streak");
const { isUserLoggedIn } = require("../middleware/auth");
const router = express();

router.post("/createStreak", isUserLoggedIn, createStreak);

module.exports = router;
