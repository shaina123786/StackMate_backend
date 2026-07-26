const express = require("express");
const chatRouter = express.Router();
const Chat = require("../Models/chat");
const User = require("../Models/user");
const { userAuth } = require("../middlewares/auth");

// 🟢 GET CHAT HISTORY & TARGET USER PROFILE
chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;

  try {
    // Target user detail fetch karein
    const targetUser = await User.findById(targetUserId).select(
      "firstName lastName photoUrl"
    );

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Chat history fetch karein
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }

    res.json({
      targetUser,
      messages: chat.messages,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = chatRouter;