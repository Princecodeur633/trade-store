import { Router } from "express";
import {
  createProvider,
  getProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
} from "../controllers/providerController";

const router = Router();

router.post("/", createProvider);
router.get("/", getProviders);
router.get("/:id", getProviderById);
router.put("/:id", updateProvider);
router.delete("/:id", deleteProvider);

export default router;
