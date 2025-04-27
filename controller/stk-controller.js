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
    // console.log(token);

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
        Authorization: `Bearer ${token} `,
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        amount: amount,
        invoiceNumber: invoiceNumber,
        sharedShortCode: false,
        orgShortCode: "123fds", // Optional
        orgPassKey: "w2sdd", // Optional
        callbackUrl: process.env.CALLBACK_URL,
        transactionDescription: "Payment for Service", // Optional description
      }),
    });
    
    // Start Push to database Fake
    // const 
    // payment = {
    //   receipt: invoiceNumber,
    //   phone: phoneNumber,
    //   amount: amount,
    //   transactionDate: new Date().toDateString(),
    // };
  
    // console.log("✅ Verified Payment:", payment);
  
    // try {
    //   const newTransaction = new transaction(payment);
    //   await newTransaction.save();

    // } catch (error) {
    //   console.error("❌ Error saving payment:", error.message);
    //   res.status(500).json({ error: "Internal Server Error" });
    // }

    // End Push to database Fake

    const responseData = await response.json();
    if (response.ok) {
      res.status(201).json(responseData);
    }
  } catch (err) {
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

      const result = await usersCollection.updateOne(
        {phone_number: payment.phone},
        {$set: {sms_tokens: payment.amount * 15}}
      );

      // TODO: Update the transaction schema to the isUsed flag to be true
      console.log(`${result.modifiedCount} documents(s) updated`);

      const changeUsedStatus = await transactionCollection.updateOne(
        {receipt: payment.receipt},
        {$set: {isUsed: true}}
      )

      console.log(`${changeUsedStatus.modifiedCount} documents(s) updated`);
      
      await client.close();
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Callback received successfully",
      });
    } catch (error) {
      console.error("❌ Error saving payment:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  