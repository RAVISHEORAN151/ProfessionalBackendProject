// why we need this model
// how it help take example
// user -> a,b,c,d,e
// channel -> cac, hcc, fcc
// count subscriber of channel cac , counting of document in which channel is cac 
// count channels subscribe by c , counting of document in which subscriber  is c


import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new  Schema(
    {
      subscriber:{
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
      },

      channel:{
        type: Schema.Types.ObjectId, // one to whom subscriber is subscribing
        ref: "User"
      }

    }, 
    {
        timestamps: true
    }
)

export const subscription = mongoose.model("Subscription", subscriptionSchema)