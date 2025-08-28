import express, { Application, Request, Response } from "express";
import cors from "cors";
import providerRoutes from "./routes/providerRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { connectDB, sequelize } from "./config/db";

const app: Application = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/providers", providerRoutes);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "API running ✅" });
});

// Middleware erreur
app.use(errorHandler);

// Connexion DB + sync
connectDB();
sequelize.sync({ alter: true }).then(() => {
  console.log("✅ Database synchronized");
});

export default app;
