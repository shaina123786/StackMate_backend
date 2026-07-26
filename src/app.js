require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const http = require("http");

const User = require("./Models/user");
const { userAuth } = require("./middlewares/auth");
const initializeSocket = require("./config/utils/socket");

// Database Connection
require("./config/database");

const authRouter = require("./router/auth");
const reqRouter = require("./router/request");
const profileRouter = require("./router/profile");
const userRouter = require("./router/userRouter");
const chatRouter = require("./router/chat");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// 🟢 CORS — ab hardcoded nahi, .env se FRONTEND_URL uthayega.
// Local dev me .env me FRONTEND_URL=http://localhost:5173 rakhna,
// Render pe env variable me apna deployed Vercel URL daalna.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routers
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", reqRouter);
app.use("/", userRouter);
app.use("/", chatRouter);

app.get("/users", async (req, res) => {
  const useremail = req.query.emailId;

  try {
    const user = await User.findOne({ emailId: useremail });
    if (!user) return res.send("user not found");

    res.send(user);
  } catch (err) {
    res.send("not getting");
  }
});

app.delete("/user", userAuth, async (req, res) => {
  const userId = req.user._id;

  try {
    await User.findByIdAndDelete(userId);
    res.send("deleted successfully");
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

app.put("/update", userAuth, async (req, res) => {
  try {
    const data = { ...req.body };
    const userId = req.user._id;

    delete data.userId;

    if (data.gender && !data.Gender) {
      data.Gender = data.gender;
      delete data.gender;
    }

    if (data.age) {
      data.age = Number(data.age);
    }

    if (!data.password || data.password.trim() === "") {
      delete data.password;
    } else {
      const passwordHash = await bcrypt.hash(data.password, 10);
      data.password = passwordHash;
    }

    const allowedUpdates = [
      "age",
      "Gender",
      "about",
      "skills",
      "firstName",
      "lastName",
      "password",
      "photoUrl",
    ];

    const isUpdateAllowed = Object.keys(data).every((k) =>
      allowedUpdates.includes(k)
    );

    if (!isUpdateAllowed) {
      return res.status(400).send("Error: Update not allowed (Invalid fields)");
    }

    if (data.skills && data.skills.length > 10) {
      return res.status(400).send("Error: Skills more than 10 not allowed");
    }

    const updatedUser = await User.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(400).send("Error: " + err.message);
  }
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("running on port " + PORT);
});