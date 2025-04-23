import express from 'express'
import { stkCallBack, STKPush } from '../controller/stk-controller.js';

const stkPushRouter = express.Router();

stkPushRouter.post('/pay', STKPush);
stkPushRouter.post('/callback', stkCallBack);

export default stkPushRouter;