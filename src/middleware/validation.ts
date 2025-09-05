import { Request, Response, NextFunction } from 'express';
import Joi, { Schema } from 'joi';

// Définition des schémas
export const schemas = {
  registerStructure: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    address: Joi.string().max(500).optional(),
    phone: Joi.string().max(50).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createBill: Joi.object({
    subscriber_code: Joi.string().max(100).required(),
    bill_number: Joi.string().max(100).required(),
    amount: Joi.number().positive().precision(2).required(),
    due_date: Joi.date().iso().required(),
    description: Joi.string().max(1000).optional(),
    late_fee: Joi.number().min(0).precision(2).optional(),
    discount: Joi.number().min(0).precision(2).optional(),
    tax_amount: Joi.number().min(0).precision(2).optional(),
  }),

  recordPayment: Joi.object({
    bill_number: Joi.string().max(100).required(),
    amount: Joi.number().positive().precision(2).required(),
    payment_method: Joi.string().max(50).optional(),
    reference: Joi.string().max(255).optional(),
    notes: Joi.string().max(1000).optional(),
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().max(50).optional(),
    search: Joi.string().max(255).optional(),
    subscriber_code: Joi.string().max(100).optional(),
  }),
};

// Middleware de validation
export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req.method === 'GET' ? req.query : req.body;
    const { error, value } = schema.validate(data, { abortEarly: false });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errorDetails,
      });
    }

    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};
