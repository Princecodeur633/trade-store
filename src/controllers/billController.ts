import { Request, Response, NextFunction } from "express";
import { Bill } from "../models/Bill";

export const createBill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await Bill.create(req.body);
    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

export const getBills = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bills = await Bill.findAll();
    res.json({ success: true, data: bills });
  } catch (err) {
    next(err);
  }
};

export const getBillById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

export const updateBill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    await bill.update(req.body);
    res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

export const deleteBill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    await bill.destroy();
    res.json({ success: true, message: "Bill deleted" });
  } catch (err) {
    next(err);
  }
};
