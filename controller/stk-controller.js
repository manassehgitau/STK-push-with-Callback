import { getTokenRequest } from "../utils/auth.js";
import dotenv from 'dotenv'

dotenv.config(); 

export const STKPush = async (req, res) => {
    try {
        const { phoneNumber, amount, invoiceNumber } = req.body;

        if (!phoneNumber || !amount || !invoiceNumber) {
            return res.status(400).json({ message: 'All fields are required'});
        }

        const token = await getTokenRequest();
        // console.log(token);

        const response = await fetch(process.env.STK_PUSH_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token} `,
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                amount: amount,
                invoiceNumber: invoiceNumber,
                sharedShortCode: true,
                orgShortCode: '',             // Optional
                orgPassKey: '',               // Optional
                callbackUrl: process.env.CALLBACK_URL,
                transactionDescription: 'Payment for Service'  // Optional description
            })
        });
        const responseData = await response.json();
        if (response.ok){
            res.status(201).json(responseData);
        }
    } catch (err) {
        res.status(500).json({ error: err.message});
    }
};

export const stkCallBack = async(req, res) => {
    const callbackData = req.body;
    console.log('📲 M-PESA Callback Received:');
    console.log('MPESA Callback:', JSON.stringify(callbackData, null, 2));

  // TODO: Save transaction to DB, mark user as paid, etc.

  res.status(200).json({
    ResultCode: 0,
    ResultDesc: 'Callback received successfully'
  });
}