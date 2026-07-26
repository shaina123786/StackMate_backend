const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      enum: {
        values: ["accepted", "rejected", "ignore", "interested"],
        message: `{VALUE} is incorrect Status type`,
      },
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// connectionRequestSchema.pre("save", function (next) {
//   const connectionRequest = this;
//   if (connectionRequest.sender.equals(connectionRequest.receiver)) {
//     throw new Error("cant't send Request to itself!");
//   }
//   next();
// });
const ConnectionRequestModel = new mongoose.model(
  "connectionRequest",  //ye kahan se arha
  connectionRequestSchema,
);
    


module.exports = ConnectionRequestModel;
