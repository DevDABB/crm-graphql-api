import User from "../models/User.js";
import { notFound } from "../errors/index.js";

const getUsers = async () => {
  return User.find();
};

const getUserById = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw notFound(
      "User not found",
      "USER_NOT_FOUND"
    );
  }

  return user;
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

export {
  getUsers,
  getUserById,
  getUserByEmail
};