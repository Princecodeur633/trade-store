import { z } from "zod";

export const createProviderSchema = z.object({
  id: z.string().min(1, "ID is required"),
  company_name: z.string().min(2, "Company name is too short"),
  business_category: z.string().min(2),
  tax_id: z.string().min(3),
  contact_email: z.string().email("Invalid email format"),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const updateProviderSchema = createProviderSchema.partial();
