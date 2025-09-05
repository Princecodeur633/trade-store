import { Request, Response, NextFunction } from "express";
import { Customer } from "../models/Customer";

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await Customer.findAll();
    throw new Error("Test error handling");
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    await customer.update(req.body);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    await customer.destroy();
    res.json({ success: true, message: "Customer deleted" });
  } catch (err) {
    next(err);
  }
};
