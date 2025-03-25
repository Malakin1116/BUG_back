import { UsersCollection } from '../db/models/user.js';

export const getUserById = async (userId) => {
  const user = await UsersCollection.findOne({ _id: userId });
  return user;
};

export const updateUser = async (userId, payload) => {
  const updatedUser = await UsersCollection.findOneAndUpdate(
    { _id: userId },
    { $set: payload },
    { new: true, runValidators: true },
  );
  return updatedUser;
};

export const countUser = async () => {
  const userCount = await UsersCollection.countDocuments();
  return userCount;
};
