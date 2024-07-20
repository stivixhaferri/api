import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type:String,
        required: true
    },
  email: {
    type: String,
    required: [true, "Email is Required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is Required"],
  },
  card_id: {
    type:String,
    required:false
  },
  paypal_email:{
    type:String,
    required:false
  },
  status:{
    type:String,
    required:false,
    default: "false"
  }
},{timestamps: true});

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw new Error("incorrect password");
  }
  throw new Error("incorrect email");
};

const UserModel = mongoose.model("Users", userSchema);

export default UserModel;
