const socket = require("socket.io");
const mongoose = require("mongoose");
const Chat = require("../../Models/chat");
const User = require("../../Models/user");
const MessageNotification = require("../../Models/messageNotification");

const onlineUsers = new Map(); // Tracks online status: userId -> socketId

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // 🔔 NEW: koi bhi page (jaise Notification page) yahan apna userId register kar sakta hai
    // taaki wo apni "personal room" join kar le — isse us user ko koi bhi naya message
    // notification mil sakta hai, chahe wo abhi kisi specific chat me na ho.
    socket.on("registerUser", (userId) => {
      if (!userId) return;
      console.log("🔔 [DEBUG] registerUser called:", userId);
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
    });

    // 🟢 User joins & marks online
    socket.on("joinChat", ({ userId, targetUserId }) => {
      onlineUsers.set(userId, socket.id);
      const roomId = [userId, targetUserId].sort().join("_");
      socket.join(roomId);

      // Notify room if target user is currently online
      const isTargetOnline = onlineUsers.has(targetUserId);
      io.to(roomId).emit("userStatusUpdate", {
        userId: targetUserId,
        isOnline: isTargetOnline,
      });
    });

    // 🟢 Save message to DB & Broadcast real-time
    // 🔴 FIX: pehle sirf { userId, targetUserId, text } liya ja raha tha —
    // type aur replyToMsg missing the, isliye GIF/audio/image/reply kabhi kaam
    // nahi kar rahe the. Ab dono liye ja rahe hain aur DB + broadcast dono me jaa rahe hain.
    socket.on(
      "sendMessage",
      async ({ userId, targetUserId, text, type, replyToMsg }) => {
        const roomId = [userId, targetUserId].sort().join("_");

        try {
          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          const newMessage = {
            senderId: userId,
            text: text,
            type: type || "text",
            replyToMsg: replyToMsg || null,
          };

          chat.messages.push(newMessage);
          await chat.save();

          // Abhi-abhi save hue message ka real DB _id nikal lo — isse delete/unsend
          // sahi message ko target kar payega (pehle _id bheja hi nahi ja raha tha)
          const savedMessage = chat.messages[chat.messages.length - 1];

          io.to(roomId).emit("messageReceived", {
            _id: savedMessage._id,
            senderId: userId,
            text: text,
            type: type || "text",
            replyToMsg: replyToMsg || null,
            createdAt: savedMessage.createdAt || new Date().toISOString(),
          });

          // 🔔 NEW: DB me bhi save karo (persist) — upsert isliye ki 10 messages bhejne pe
          // bhi ek hi record rahe, duplicate na bane. "lastMessageAt" update hota rahega.
          await MessageNotification.findOneAndUpdate(
            { sender: userId, receiver: targetUserId },
            { lastMessageAt: savedMessage.createdAt || new Date() },
            { upsert: true, new: true }
          );

          // Live push bhi bhejo taaki turant dikhe (jaisa pehle karte the)
          const sender = await User.findById(userId).select("firstName lastName");
          console.log("🔔 [DEBUG] Sending notification to room:", targetUserId, "from:", sender?.firstName);
          io.to(targetUserId).emit("newMessageNotification", {
            senderId: userId,
            senderName: sender
              ? `${sender.firstName} ${sender.lastName || ""}`.trim()
              : "Someone",
            text,
            createdAt: savedMessage.createdAt || new Date().toISOString(),
          });
        } catch (err) {
          console.error("Socket Message Save Error:", err);
        }
      }
    );

    // 🟢 NEW: Delete / Unsend Message
    // Pehle ye handler exist hi nahi karta tha — isliye frontend se "Unsend" dabane
    // par kuch hota hi nahi tha (backend sun hi nahi raha tha).
    // "Delete for me" backend pe kuch nahi karta (wo sirf sender ki apni screen se
    // hatna chahiye, frontend already local-only handle karta hai).
    // "Unsend" ke liye hum DB se message hata dete hain aur dono users ko batate hain.
    socket.on("deleteMessage", async ({ msgId, targetUserId, isUnsend }) => {
      if (!isUnsend) return; // delete-for-me backend involvement nahi chahiye

      // Optimistic (abhi tak server-confirm nahi hue) messages ke temp id "temp-..." se
      // shuru hote hain — ye kabhi bhi real MongoDB _id nahi hote, isliye query hi mat chalao.
      if (!mongoose.Types.ObjectId.isValid(msgId)) {
        console.log("⚠️ Skipping delete for unconfirmed/temp message:", msgId);
        return;
      }

      try {
        const chat = await Chat.findOne({ "messages._id": msgId });
        if (!chat) return;

        const message = chat.messages.id(msgId);
        if (!message) return;

        const senderId = message.senderId.toString();
        const roomId = [senderId, targetUserId].sort().join("_");

        message.deleteOne();
        await chat.save();

        io.to(roomId).emit("messageDeleted", { msgId });
      } catch (err) {
        console.error("Delete Message Error:", err);
      }
    });

    // 🟢 Handle Disconnect (Offline status)
    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("userStatusUpdate", {
            userId: userId,
            isOnline: false,
            lastSeen: new Date().toISOString(),
          });
          break;
        }
      }
    });
  });
};

module.exports = initializeSocket;