const express = require("express");
const {
  sendOtp,
  verifyOtp,
  updateUserDetails,
} = require("../controllers/auth");
const { isUserLoggedIn } = require("../middleware/auth");

const router = express.Router();

//otp routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.patch("/update-profile", isUserLoggedIn, updateUserDetails);

module.exports = router;
