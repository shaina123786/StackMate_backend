const express = require("express");
const authRouter = express.Router();
const bcrypt = require("bcrypt");

const { validateSign } = require("../config/utils/validate");
const User = require("../Models/user");

// 🟢 FIX: Frontend (Vercel) aur backend (Render) alag domains pe honge.
// Cross-domain cookie kaam karne ke liye "sameSite: none" + "secure: true" chahiye
// (browsers isse enforce karte hain). Local dev me (same-site: localhost) "lax" hi
// theek rehta hai, isliye NODE_ENV ke hisaab se switch kar rahe hain.
const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd, // sameSite:"none" ke liye secure:true zaroori hai (HTTPS)
};

authRouter.post("/signup", async (req, res) => {
  try {
    validateSign(req);
    const { firstName, lastName, password, emailId } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      password: passwordHash,
      emailId,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    res.cookie("token", token, {
      ...cookieOptions,
      expires: new Date(Date.now() + 8 * 3600000),
    });

    res.send("data save successfully");
  } catch (err) {
    res.status(400).send("Not save sucessfully: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid Credentials");
    }
    const isPassValid = await user.validatePassword(password);
    if (isPassValid) {
      const token = await user.getJWT();

      res.cookie("token", token, {
        ...cookieOptions,
        expires: new Date(Date.now() + 8 * 3600000),
      });

      console.log("Login Success");
      res.send(user);
    } else {
      throw new Error("Password is not correct");
    }
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    ...cookieOptions,
    expires: new Date(Date.now()),
  });
  res.send("Logout successfully!");
});

module.exports = authRouter;