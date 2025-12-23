import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Hospital Queue API running");
});

app.use("/api/v1/auth", authRouter);

export default app;