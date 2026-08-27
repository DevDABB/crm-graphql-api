import Order from "../models/Order.js";
import User from "../models/User.js";
import { notFound, badRequest } from "../errors/index.js";

const getOrders = async () => {
  return Order.find();
};

const createOrder = async (input) => {
  if (input.total <= 0) {
    throw badRequest(
      "Order total must be greater than 0",
      "INVALID_ORDER_TOTAL"
    );
  }

  if (!input.userId) {
    throw badRequest(
      "User is required",
      "INVALID_ORDER_USER"
    );
  }

  const user = await User.findById(input.userId);

  if (!user) {
    throw notFound(
      "User not found",
      "USER_NOT_FOUND"
    );
  }

  const validStatuses = [
    "PENDING",
    "COMPLETED",
    "CANCELLED"
  ];

  if (!validStatuses.includes(input.status)) {
    throw badRequest(
      "Invalid order status",
      "INVALID_ORDER_STATUS"
    );
  }

  const order = new Order(input);

  return order.save();
};

export {
  getOrders,
  createOrder
};