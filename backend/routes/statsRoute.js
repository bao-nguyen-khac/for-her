import express from "express";
import { getDashboardStats } from "../controllers/statsController.js";
import adminAuth from "../middleware/adminAuth.js";

const statsRouter = express.Router();

statsRouter.get("/dashboard", adminAuth, getDashboardStats);

export default statsRouter;
