const express = require('express');
const { userAuth } = require('../middlewares/auth');
const connectionRequest = require('../Models/connectionRequest');
const User = require('../Models/user');
const MessageNotification = require('../Models/messageNotification'); // 🔔 NEW

const userSafedata = "firstName lastName age Gender skills about photoUrl";

const userRouter = express.Router();
userRouter.get("/user/request/received", userAuth, async (req, res) => {
    try {
        
        const loggedInUser = req.user;
        const newRequest = await connectionRequest.find({
            receiver: loggedInUser._id,
            status: "interested",
        }).populate(
            "sender",
            userSafedata,
        );
        res.json({
            message: "Data fetched successfully",
            data: newRequest,
        });
        
       
    } catch (err) {
        res.status(400).send("Error :" + err.message);
    }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {
    

         const loggedInUser = req.user;
        const newRequest = await connectionRequest.find({
            $or: [
                { receiver: loggedInUser._id, status: "accepted" },
                {
                    sender: loggedInUser._id, status: "accepted"
                },
            ],
         
        }).populate(
            "sender",
            userSafedata)
            .populate(
                "receiver",
                userSafedata,
            );
        

        const data = newRequest.map((row) => {
            if (row.sender._id.toString() === loggedInUser._id.toString()) {
                return row.receiver;
            }
            return row.sender;
        });
        res.json({
            message: "Data fetched successfully",
            data,
        });
    } catch (err) {
        res.status(400).send("Error :" + err.message);
    }
});

// 🔔 NEW: Sab pending message-notifications laao (logout/login ke baad bhi persist rahengi,
// kyunki ye DB se aa rahi hain, sirf memory se nahi)
userRouter.get("/user/message-notifications", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const notifs = await MessageNotification.find({
            receiver: loggedInUser._id,
        })
            .populate("sender", userSafedata)
            .sort({ lastMessageAt: -1 });

        res.json({
            message: "Data fetched successfully",
            data: notifs,
        });
    } catch (err) {
        res.status(400).send("Error :" + err.message);
    }
});

// 🔔 NEW: Jab tum kisi ki chat khologe, uski notification "read" (clear) ho jaani chahiye
userRouter.delete("/user/message-notifications/:senderId", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const { senderId } = req.params;

        await MessageNotification.deleteOne({
            sender: senderId,
            receiver: loggedInUser._id,
        });

        res.json({ message: "Notification cleared" });
    } catch (err) {
        res.status(400).send("Error :" + err.message);
    }
});

userRouter.get("/feed", userAuth, async (req, res) => {
    try {

        // own,req,acce,reject,ya mai ignore
        const loggedInUser = req.user;

        const page = parseInt(req.query.page)|| 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 50 ? 50 : limit;
        const skip = (page - 1) * limit;

        const newRequest = await connectionRequest.find({
            $or: [{ sender: loggedInUser._id }, { receiver: loggedInUser._id }],
        }).select("sender receiver");
        

        let hideUser = new Set();
        newRequest.forEach((req) => {
            hideUser.add(req.sender.toString());
            hideUser.add(req.receiver.toString());          
        });

        const users = await User.find({
            $and: [
                { _id: { $nin: Array.from(hideUser) } },
                { _id: { $ne: loggedInUser._id } },
            ],
        }).select(userSafedata).skip(skip).limit(limit);

        res.json({ data:users });
    }catch(err) {
        res.status(400).send("Error :" + err.message);
    }
});
module.exports = userRouter;