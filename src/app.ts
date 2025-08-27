import express, { Application, Request, Response } from "express";
import cors from "cors";

const app: Application = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "API running" });
});

export default app;
