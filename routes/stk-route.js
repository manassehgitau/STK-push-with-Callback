import express from 'express'
import { STKPush } from '../controller/stk-controller.js';

const stkPushRouter = express.Router();

stkPushRouter.post('/pay', STKPush);

export default stkPushRouter;