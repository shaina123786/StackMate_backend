const jwt = require('jsonwebtoken');

const User = require("../Models/user");

const userAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token)
            return res.status(401).send("Please Login!");

        const decodedMsg = await jwt.verify(token, "Shaina@123");

        const { _id } = decodedMsg;

        const user = await User.findById(_id);
        if (!user)
            throw new Error("user not exist");

        req.user = user; //ye
        
        next();
    } catch (err) {
        res.status(400).send("Error: " + err.message);
        
    
    }
    
};
module.exports = { userAuth };