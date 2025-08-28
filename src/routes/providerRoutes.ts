import { Router } from "express";
import {
  createProvider,
  getProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
} from "../controllers/providerController";
import { validate } from "../middlewares/validate";
import { createProviderSchema, updateProviderSchema } from "../validators/providerValidator";

const router = Router();

router.post("/", validate(createProviderSchema), createProvider);
router.get("/", getProviders);
router.get("/:id", getProviderById);
router.put("/:id", validate(updateProviderSchema), updateProvider);
router.delete("/:id", deleteProvider);

export default router;
