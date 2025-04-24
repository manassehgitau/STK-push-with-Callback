import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import stkPushRouter from './routes/stk-route.js';
import bodyParser from 'body-parser'
import connectDB from './config/db.js';
import stkCallBackRouter from './routes/callback.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json())

const PORT = process.env.PORT;

connectDB();
app.use("/api", stkPushRouter);
app.use("/callback", stkCallBackRouter);
app.get("/", (req, res) => res.send("STK push is running"));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})