import UserModel from "../models/User.js";
import jwt from "jsonwebtoken";

const sk = process.env.SECRET_KEY;


export const checkUser = (req, res, myToken) => {
  const token = myToken;
  if (token) {
    jwt.verify(
      token,
      sk,
      async (err, decodedToken) => {
        if (err) {
          res.json({ status: false });
          
        } else {
          const user = await UserModel.findById(decodedToken.id);
          if (user) res.json({ status: true, user: user.email , id: user._id });
          else res.json({ status: false });
         
        }
      }
    );
  } else {
    res.json({ status: false });
    next();
  }
};
