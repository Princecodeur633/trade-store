import { Request, Response } from "express";
import Payment from "../models/Payment";
import paymentService from "../services/paymentService";

export const createPayment = async (req: Request, res: Response) => {
  try {
    const payment = await paymentService.processPayment(req.body);
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  const payments = await Payment.findAll();
  res.json(payments);
};
