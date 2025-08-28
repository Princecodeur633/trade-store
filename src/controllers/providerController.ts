import { Request, Response, NextFunction } from "express";
import { Provider } from "../models/Provider";

// ✅ Create
export const createProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await Provider.create(req.body);
    res.status(201).json({ success: true, data: provider });
  } catch (err) {
    next(err);
  }
};

// ✅ Get all
export const getProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = await Provider.findAll();
    res.json({ success: true, data: providers });
  } catch (err) {
    next(err);
  }
};

// ✅ Get by ID
export const getProviderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await Provider.findByPk(req.params.id);
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });
    res.json({ success: true, data: provider });
  } catch (err) {
    next(err);
  }
};

// ✅ Update
export const updateProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await Provider.findByPk(req.params.id);
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    await provider.update(req.body);
    res.json({ success: true, data: provider });
  } catch (err) {
    next(err);
  }
};

// ✅ Delete
export const deleteProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await Provider.findByPk(req.params.id);
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    await provider.destroy();
    res.json({ success: true, message: "Provider deleted" });
  } catch (err) {
    next(err);
  }
};
