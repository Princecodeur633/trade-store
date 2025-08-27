import express, { Application, Request, Response } from "express";
import cors from "cors";
import paymentRoutes from "./routes/paymentRoutes";
import notificationRoutes from "./routes/notificationRoutes";

const app: Application = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "API running" });
});

export default app;


app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
