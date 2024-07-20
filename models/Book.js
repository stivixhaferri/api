import mongoose from "mongoose";
import bcrypt from "bcrypt";

const bookSchema = new mongoose.Schema({
    email: {
        type:String,
        required: true
    },
    phone: {
    type: String,
    required: true,
    
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type:String,
    required:true
  },
  total:{
    type:String,
    required:true
  },
  message:{
    type:String,
    required:true
  },
  car_id: {
    type:String,
    required: true
  }
 
},{timestamps: true});



const BookModel = mongoose.model("Book", bookSchema);

export default BookModel;
