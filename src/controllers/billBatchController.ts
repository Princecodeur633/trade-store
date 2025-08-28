import { Request, Response, NextFunction } from "express";
import { BillBatch } from "../models/BillBatch";

export const createBillBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batch = await BillBatch.create(req.body);
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
};

export const getBillBatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batches = await BillBatch.findAll();
    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
};

export const getBillBatchById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batch = await BillBatch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: "BillBatch not found" });
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
};

export const updateBillBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batch = await BillBatch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: "BillBatch not found" });

    await batch.update(req.body);
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
};

export const deleteBillBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batch = await BillBatch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: "BillBatch not found" });

    await batch.destroy();
    res.json({ success: true, message: "BillBatch deleted" });
  } catch (err) {
    next(err);
  }
};
