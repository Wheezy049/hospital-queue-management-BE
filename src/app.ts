import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import departmentRouter from "./routes/department.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Hospital Queue API running");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/department", departmentRouter);

export default app;