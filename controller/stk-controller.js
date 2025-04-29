import transaction from "../models/transactionModel.js";
import { getTokenRequest } from "../utils/auth.js";
import { MongoClient } from "mongodb"
import dotenv from "dotenv";

dotenv.config();
const mongoURI = process.env.MONGO_URI
const client = new MongoClient(mongoURI)
const database = client.db('priceTracker')
const usersCollection = database.collection('users')
const transactionCollection = database.collection('transactions')

export const STKPush = async (req, res) => {
  try {
    const { phoneNumber, amount, invoiceNumber } = req.body;

    if (!phoneNumber || !amount || !invoiceNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const token = await getTokenRequest();

    console.log("Payload:", JSON.stringify({
      phoneNumber,
      amount,
      invoiceNumber,
      sharedShortCode: false,
      callbackUrl: process.env.CALLBACK_URL,
    }));

    const response = await fetch(process.env.STK_PUSH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        phoneNumber,
        amount,
        invoiceNumber,
        sharedShortCode: false,
        orgShortCode: "123fds",
        orgPassKey: "w2sdd",
        callbackUrl: process.env.CALLBACK_URL,
        transactionDescription: "Payment for Service",
      }),
    });

    const responseData = await response.json();

    // ✅ FAKE SIMULATED CALLBACK FOR DEMO PURPOSES
    const payment = {
      receipt: invoiceNumber,
      phone: phoneNumber,
      amount: amount,
      transactionDate: new Date().toISOString(),
    };

    console.log("✅ Simulated Verified Payment (for demo):", payment);

    // Save transaction
    const newTransaction = new transaction(payment);
    await newTransaction.save();

    // Add tokens
    const tokensToAdd = payment.amount * 15;

    const result = await usersCollection.updateOne(
      { phone_number: payment.phone },
      { $inc: { sms_tokens: tokensToAdd } }
    );

    console.log(`${result.modifiedCount} document(s) updated with ${tokensToAdd} tokens`);

    // Mark transaction as used
    const changeUsedStatus = await transactionCollection.updateOne(
      { receipt: payment.receipt },
      { $set: { isUsed: true } }
    );

    console.log(`${changeUsedStatus.modifiedCount} transaction marked as used`);

    // ✅ END DEMO LOGIC

    res.status(201).json({
      message: "STK push simulated successfully",
      response: responseData,
      fake_payment: payment,
    });

  } catch (err) {
    console.error("❌ Error in STKPush:", err.message);
    res.status(500).json({ error: err.message });
  }
};


export const stkCallBack = async (req, res) => {
    const callbackData = req.body?.Body?.stkCallback;
    console.log("📲 MPESA Callback Received:");
    console.log(JSON.stringify(req.body, null, 2));
  
    if (!callbackData || callbackData.ResultCode !== 0) {
      return res.status(200).json({
        ResultCode: callbackData?.ResultCode || 1,
        ResultDesc: "Failed transaction or missing data"
      });
    }
  
    const metaData = callbackData.CallbackMetadata?.Item || [];
  
    const getField = (field) => {
      for (let i = 0; i < metaData.length; i++) {
        if (metaData[i].Name === field) {
          return metaData[i].Value;
        }
      }
      return null;
    };
  
    const payment = {
      receipt: getField("MpesaReceiptNumber"),
      phone: getField("PhoneNumber"),
      amount: getField("Amount"),
      transactionDate: getField("TransactionDate"),
    };
  
    console.log("✅ Verified Payment:", payment);
  
    try {
      const newTransaction = new transaction(payment);
      await newTransaction.save();

      const tokensToAdd = payment.amount * 15;

      const result = await usersCollection.updateOne(
        {phone_number: payment.phone},
        {$set: {sms_tokens: tokensToAdd}}
      );

      // TODO: Update the transaction schema to the isUsed flag to be true
      console.log(`${result.modifiedCount} documents(s) updated`);

      const changeUsedStatus = await transactionCollection.updateOne(
        {receipt: payment.receipt},
        {$set: {isUsed: true}}
      )

      console.log(`${changeUsedStatus.modifiedCount} documents(s) updated`);
      
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Callback received successfully",
      });
    } catch (error) {
      console.error("❌ Error saving payment:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  