import express from 'express'
import { stkCallBack } from '../controller/stk-controller.js';

const stkCallBackRouter = express.Router();

stkCallBackRouter.post('/', stkCallBack);

export default stkCallBackRouter;