import { Router, type IRouter } from "express";
import healthRouter from "./health";
import luckyRouter from "./lucky";

const router: IRouter = Router();

router.use(healthRouter);
router.use(luckyRouter);

export default router;
