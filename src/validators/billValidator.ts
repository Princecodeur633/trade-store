import { z } from "zod";

export const createBillSchema = z.object({
  provider_id: z.string().min(1, "Provider ID required"),
  customer_id: z.string().min(1, "Customer ID required"),
  batch_id: z.string().optional(),
  bill_reference: z.string().min(3, "Bill reference required"),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().default("XAF"),
  due_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid due date",
  }),
  billing_period: z.string().min(3),
  status: z.enum(["pending", "paid", "overdue", "cancelled", "disputed"]).optional(),
});

export const updateBillSchema = createBillSchema.partial();
