const mongoose = require("mongoose");

// Har sender-receiver pair ka sirf EK hi record hoga — chahe 10 messages bhejo,
// ye record bas update (upsert) hota rahega, naya duplicate nahi banega.
const messageNotificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ek sender-receiver pair ka sirf ek record — DB level pe bhi guarantee
messageNotificationSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model("MessageNotification", messageNotificationSchema);