import mongoose from "mongoose";
import bcrypt from "bcrypt";

const commentSchema = new mongoose.Schema({
    username: {
        type:String,
        required: true
    },
  comment: {
    type: String,
    required: true,
    
  },
  rate: {
    type: Number,
    required: true,
  },
  car_id: {
    type:String,
    required:true
  },
 
},{timestamps: true});



const CommentModel = mongoose.model("Comment", commentSchema);

export default CommentModel;
