const express = require("express");
const { isUserLoggedIn, isAdmin } = require("../middleware/auth");
const { createQuestionBank, addQuestionToQuestionBank } = require("../controllers/question");
const router = express.Router();

router.post("/createQuestionBank", isUserLoggedIn, isAdmin, createQuestionBank);
router.post("/addQuestionToQuestionBank", isUserLoggedIn, isAdmin, addQuestionToQuestionBank);

module.exports = router