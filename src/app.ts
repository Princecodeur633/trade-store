import express, { Application, Request, Response } from "express";
import cors from "cors";
import providerRoutes from "./routes/providerRoutes";
import customerRoutes from "./routes/customerRoutes";
import billBatchRoutes from "./routes/billBatchRoutes";
import billRoutes from "./routes/billRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { connectDB, sequelize } from "./config/db";

const app: Application = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/providers", providerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bill-batches", billBatchRoutes);
app.use("/api/bills", billRoutes);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "API running ✅" });
});

// Middleware erreur
app.use(errorHandler);

// DB
connectDB();
sequelize.sync({ alter: true }).then(() => {
  console.log("✅ Database synchronized");
});

export default app;
