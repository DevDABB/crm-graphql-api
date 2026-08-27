import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;