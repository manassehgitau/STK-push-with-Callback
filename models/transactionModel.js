import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    receipt: {
      type: String,
      required: true,
    },
    transactionDate: {
      type: String,
      required: true,
    },
    isUsed: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const transaction = mongoose.model("Transaction", transactionSchema);
export default transaction;
