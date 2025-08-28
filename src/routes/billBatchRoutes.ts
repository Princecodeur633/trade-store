import { Router } from "express";
import {
  createBillBatch,
  getBillBatches,
  getBillBatchById,
  updateBillBatch,
  deleteBillBatch,
} from "../controllers/billBatchController";

const router = Router();

router.post("/", createBillBatch);
router.get("/", getBillBatches);
router.get("/:id", getBillBatchById);
router.put("/:id", updateBillBatch);
router.delete("/:id", deleteBillBatch);

export default router;
