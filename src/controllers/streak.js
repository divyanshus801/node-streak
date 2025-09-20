const { Streak, User } = require("../models");
const { validateCreateStreak } = require("../validators/streak");

// Mark today's streak as completed
const updateTodayStreak = async (req, res) => {
  try {
    const { activityType } = req.body;
    const userId = req.user.id;

    // Get user's streak
    const streak = await Streak.findOne({
      where: { userId },
    });

    if (!streak) {
      return res.status(404).json({
        success: false,
        message: "No streak found for user",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivityDate = streak.lastActivityDate
      ? new Date(streak.lastActivityDate)
      : null;
    if (lastActivityDate) {
      lastActivityDate.setHours(0, 0, 0, 0);
    }

    // If already completed today, return early
    if (lastActivityDate && lastActivityDate.getTime() === today.getTime()) {
      return res.status(200).json({
        success: true,
        message: "Streak already marked as completed for today",
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityDate: streak.lastActivityDate,
          lastActivityType: streak?.lastActivityType,
        },
      });
    }

    // Calculate new streak count
    let newStreakCount = streak.currentStreak;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastActivityDate) {
      // First activity ever
      newStreakCount = 1;
    } else if (lastActivityDate.getTime() === yesterday.getTime()) {
      // Continued streak
      newStreakCount += 1;
    } else if (lastActivityDate.getTime() < yesterday.getTime()) {
      // Streak broken, start new
      newStreakCount = 1;
    }

    // Update the streak
    await streak.update({
      currentStreak: newStreakCount,
      longestStreak: Math.max(newStreakCount, streak.longestStreak),
      lastActivityDate: today,
      lastActivityType: activityType,
    });

    return res.status(200).json({
      success: true,
      message: "Streak updated successfully",
      data: {
        currentStreak: newStreakCount,
        longestStreak: Math.max(newStreakCount, streak.longestStreak),
        lastActivityDate: today,
      },
    });
  } catch (error) {
    console.error("Error updating streak:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createStreak = async (req, res) => {
  try {
    const userId = req.user.id;

    // Create initial streak
    const streak = await Streak.create({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      streakStartDate: new Date(),
    });

    // Get created streak with user info
    const createdStreak = await Streak.findOne({
      where: { id: streak.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email"], // Only include safe user fields
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Streak created successfully",
      data: createdStreak,
    });
  } catch (error) {
    console.error("Error creating streak:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user's streaks
const getUserStreaks = async (req, res) => {
  try {
    const userId = req.user.id;

    const streaks = await Streak.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: streaks,
    });
  } catch (error) {
    console.error("Error fetching streaks:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createStreak,
  getUserStreaks,
  updateTodayStreak,
};
