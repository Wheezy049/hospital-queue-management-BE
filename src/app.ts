import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import departmentRouter from "./routes/department.routes";
import appointmentRouter from "./routes/appointment.routes";
import quequeRouter from "./routes/queque.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Hospital Queue API running");
});

app.use("/auth", authRouter);
app.use("/departments", departmentRouter);
app.use("/appointments", appointmentRouter);
app.use("/queque", quequeRouter);

export default app;