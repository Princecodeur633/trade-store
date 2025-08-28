import { Router } from "express";
import { sendNotification, getNotifications } from "../controllers/notificationController";

const router = Router();

router.post("/", sendNotification);
router.get("/", getNotifications);

export default router;
