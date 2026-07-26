const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const User = require("../Models/user");

// 1. 🟢 GET PROFILE VIEW (Isse Body.jsx ka 404 Error Khatam Ho Jayega)
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user; // userAuth middleware se authenticated user mil jayega
    res.json({
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// 2. 🟢 EDIT PROFILE ROUTE
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    const data = { ...req.body };
    const userId = req.user._id;

    // Delete unnecessary extra fields if sent
    delete data.userId;

    // Handle gender key casing (if frontend sends lowercase 'gender')
    if (data.gender && !data.Gender) {
      data.Gender = data.gender;
      delete data.gender;
    }

    if (data.age) {
      data.age = Number(data.age);
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "photoUrl",
      "age",
      "Gender",
      "about",
      "skills",
    ];

    const isUpdateAllowed = Object.keys(data).every((k) =>
      allowedFields.includes(k)
    );

    if (!isUpdateAllowed) {
      return res.status(400).send("Update not allowed: Invalid fields");
    }

    if (data.skills && data.skills.length > 10) {
      return res.status(400).send("Skills more than 10 not allowed");
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
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = profileRouter;