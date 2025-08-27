import { Request, Response } from "express";
import Notification from "../models/Notification";
import notificationService from "../services/notificationService";

export const sendNotification = async (req: Request, res: Response) => {
  try {
    const notif = await notificationService.send(req.body);
    res.status(201).json(notif);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  const notifications = await Notification.findAll();
  res.json(notifications);
};
