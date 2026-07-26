const express = require("express");

const reqRouter = express.Router();

const { userAuth } = require("../middlewares/auth");

const User = require("../Models/user");

const connectionRequest = require("../Models/connectionRequest");
// const connectionRequestModel = require('../Models/connectionRequest');

reqRouter.post(
  "/request/send/:status/:toUserId", userAuth,
  async (req, res) => {
    try {
      const sender = req.user._id;
      const receiver = req.params.toUserId;
      const status = req.params.status;

      const allowedStatus = ["ignore", "interested"];
      if (!allowedStatus.includes(status)) {
        return res.send("Invalid status");
      }
     
          if (sender.equals(receiver)) {
              throw new Error("connection request not allow to send itself");
      }
     
      const toUser = await User.findById(receiver);
      if (!toUser) {
        return res.status(400).send("user not exist");
        }
        
      const exisRequest = await connectionRequest.findOne({
        $or: [
          { sender, receiver },// Abaan->ibran
          { sender: receiver, receiver: sender },// ibran->abaan 
        ],
      });
      if (exisRequest) {
        return res.status(400).send("connection request already exist");
      }

      const newRequest = new connectionRequest({
        sender,
        receiver,
        status,
      });

      const data = await newRequest.save();
      // res.json({ message: req.user.firstName , data });
      let message = "";

      if (status === "interested") {
        message = `💖${req.user.firstName} is interested in connecting with ${toUser.firstName}!`;
      } else if (status === "ignore") {
        message = `😶${req.user.firstName} ignored ${toUser.firstName}'s profile.`;
      }

      res.json({
        message,
        action: "You can Accept ✅ or Reject ❌ this request.",
        data,
      });
      //  res.send(user.firstName + " " + " send Request!");
    } catch (err) {
      res.status(400).send("Error :" + err.message);
    }
  },
);


reqRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
  try {

    const loggedInUser = req.user;
    const { status, requestId } = req.params;

    const allowedStatus = ["accepted", "rejected"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).send("Status not allowed!");
    }

    const request = await connectionRequest.findOne({
      sender: requestId,
      status: "interested",
      receiver: loggedInUser._id,
    });


    
    if (!request) {
      return res.status(404).send("Connection request not found");
    }

    request.status = status;

    const data = await request.save();

    res.json({
      message: `Connection request ${status}`,
      data,
    });

  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});
module.exports = reqRouter; 