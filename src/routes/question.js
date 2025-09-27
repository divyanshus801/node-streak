const express = require("express");
const { isUserLoggedIn, isAdmin } = require("../middleware/auth");
const { createQuestionBank, addQuestionToQuestionBank, getAllQuestionByQuestionBankId, uploadQuestionsCSV, testSend } = require("../controllers/question");
const multer = require("multer");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/createQuestionBank", isUserLoggedIn, isAdmin, createQuestionBank);
router.post("/addQuestionToQuestionBank", isUserLoggedIn, isAdmin, addQuestionToQuestionBank);
router.get("/getAllQuestion", isUserLoggedIn , getAllQuestionByQuestionBankId)
router.post("/upload-questions", upload.single("file"), uploadQuestionsCSV);
router.post("/testSqs", testSend);

module.exports = router