const jwt = require("jsonwebtoken");
const { User, UserOtp } = require("../models");
const bcrypt = require("bcryptjs");
const { validateCreateUser, validateVerifyOtp } = require("../validators/auth");
const generateOtp = require("../utils/generateOtp");

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ where: { phone: phone } });

    const generatedOtp = generateOtp(6);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 5min

    const createdOtp = await UserOtp.create({
      userId: user ? user?.id : null,
      phone,
      otp: generatedOtp,
      expiresAt: expiry,
    });
    if (process.env.NODE_ENV === "dev") {
      return res.status(201).json({
        message: "OTP sent successfully",
        otp: createdOtp.otp,
        otpId: createdOtp?.id,
      });
    } else {
      return res.status(201).json({
        message: "OTP sent successfully",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server Error!" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, role } = req.body;
    const validatorRes = validateVerifyOtp(req.body);
    if (validatorRes.error) {
      return res.status(400).json({
        message: validatorRes.error.details.map((d) => d.message),
      });
    }
    const otpRecord = await UserOtp.findOne({
      where: { phone: phone, isUsed: false },
      order: [["createdAt", "DESC"]],
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "OTP not found or Already Used",
      });
    }
    if (otpRecord?.expiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (otpRecord?.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    await otpRecord.update({ isUsed: true });

    let userRecord = await User.findOne({ where: { phone } });

    if (!userRecord) {
      userRecord = await User.create({
        phone: phone,
        isPhoneVerified: true,
        role: role ? role : "user"
      });
    } else {
      if (!userRecord?.isPhoneVerified) {
        userRecord.isPhoneVerified = true;
        await userRecord.save();
      }
    }

    const token = jwt.sign({ id: userRecord.id, role: userRecord.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      status: true,
      message: "Phone Verified Successfully",
      user: {
        id: userRecord?.id,
        phone: userRecord?.phone,
        isPhoneVerified: userRecord?.isPhoneVerified,
        name: userRecord?.name,
      },
      accessToken: token,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Login user
const updateUserDetails = async (req, res) => {
  try {
    const { password, name } = req.body;
    const userD = req.user;
    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }
    if (!name) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    // Find user
    const user = await User.findOne({ where: { id: userD?.id } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedData = await user.update({
      name,
      password: hashedPassword,
    });

    return res.status(200).json({
      message: "Profile updated Successfully",
      user: {
        name: updatedData?.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  updateUserDetails,
};
