import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import departmentRouter from "./routes/department.routes";
import appointmentRouter from "./routes/appointment.routes";
import queueRouter from "./routes/queue.routes";
import hospitalRouter from "./routes/hospital.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Qure API running");
});

app.use("/auth", authRouter);
app.use("/departments", departmentRouter);
app.use("/appointments", appointmentRouter);
app.use("/queue", queueRouter);
app.use("/hospitals", hospitalRouter);

export default app;