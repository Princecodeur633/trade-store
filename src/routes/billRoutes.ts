import { Router } from "express";
import {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
} from "../controllers/billController";
import { validate } from "../middlewares/validate";
import { createBillSchema, updateBillSchema } from "../validators/billValidator";

const router = Router();

router.post("/", validate(createBillSchema), createBill);
router.get("/", getBills);
router.get("/:id", getBillById);
router.put("/:id", validate(updateBillSchema), updateBill);
router.delete("/:id", deleteBill);

export default router;
