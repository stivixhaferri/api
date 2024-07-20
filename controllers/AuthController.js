import UserModel from "../models/User.js";
import jwt from "jsonwebtoken";


const sk = process.env.SECRET_KEY

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, sk , {
    expiresIn: maxAge,
  });
};

const handleErrors = (err) => {
  let errors = { email: "", password: "" };

  console.log(err);
  if (err.message === "incorrect email") {
    errors.email = "That email is not registered";
  }

  if (err.message === "incorrect password") {
    errors.password = "That password is incorrect";
  }

  if (err.code === 11000) {
    errors.email = "Email is already registered";
    return errors;
  }

  if (err.message.includes("Users validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

export const register = async (req, res, next) => {
  try {
    const {username ,  email, password } = req.body;
    const user = await UserModel.create({username ,  email, password });
    const token = createToken(user._id);

    res.cookie("jwt", token, {
      withCredentials: true,
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ user: user.username , created: true , });
  } catch (err) {
    console.log(err);
    const errors = handleErrors(err);
    res.json({ errors, created: false });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.login(email, password);
    const token = createToken(user._id);

    res.cookie("jwt", token, {
        withCredentials: true,
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000,
      });
      
      res.status(200).json({ user: user.username , created: true , });
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, status: false });
  }
};


export const getUser = async (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, sk);
        req.user = decoded; // Attach the decoded token to the request object

        const userId = req.user.id;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.json({ user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
