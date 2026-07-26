const mongoose = require('mongoose');

const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        minLength: 4,
        maxLength: 40,
        required: true
    },
    lastName: {
        type: String,
    },
    Gender: {
        type: String,
        enum: {
            values: ["male", "female", "other"],
            message:`{VALUE} is not a valid Gender`,
        },
        // validate(value) {
        //     if (!["male", "female", "other"].includes(value)) {
        //         throw new Error("Gender data is not valid!");
        //     }
        // },
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is not valid" + value); //isme
            }
        }
    }, 
    age: {
        type: Number,
        min:18 
    },
    password: {
        type: String,
        required: true,
       
    },
    about: {
        type: String,
        default:""
    },
    skills: {
        type: [String],
    },
    photoUrl: {
    type: String,
    default: ""
},
},
{
  timestamps:true,
    });

userSchema.index({ firstName: 1, lastName: 1 });
 
userSchema.methods.getJWT = async function () {
    const user = this;
    const token = await jwt.sign({ _id: user._id }, "Shaina@123", { expiresIn: "7d" });
    return token;
        
}

userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;

    const isPassValid = await bcrypt.compare(passwordInputByUser, passwordHash);
        
    return isPassValid;
}

    
const User = mongoose.model("User", userSchema);
module.exports = User;