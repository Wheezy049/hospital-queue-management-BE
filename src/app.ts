import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import departmentRouter from "./routes/department.routes";
import appointmentRouter from "./routes/appointment.routes";
import queueRouter from "./routes/queue.routes";
import hospitalRouter from "./routes/hospital.routes";
import availabilityRouter from "./routes/availability.routes";
import rateLimiter from "express-rate-limit";
import helmet from "helmet";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
      },
    },
  })
)

app.use(cors());
app.use(express.json());

const globalLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: "Too many requests from this IP, please try again later." }
});

app.use(globalLimiter);

app.get("/", (_, res) => {
  res.send("Qure API running");
});

app.use("/auth", authRouter);
app.use("/departments", departmentRouter);
app.use("/appointments", appointmentRouter);
app.use("/queue", queueRouter);
app.use("/hospitals", hospitalRouter);
app.use("/availability", availabilityRouter);

export default app;