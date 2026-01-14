import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import cron from "node-cron";
import { cleanupExpiredAppointments } from "./jobs/cleanup";

const PORT = process.env.PORT || 5000;

cron.schedule("0 0 * * *", async () => {
  console.log("Running daily cleanup job...");
  await cleanupExpiredAppointments();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
