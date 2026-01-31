import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import cron from "node-cron";
import { cleanupExpiredAppointments } from "./jobs/cleanup";
import swaggerDocs from "./utils/swagger";

const PORT = process.env.PORT || 5000;

// Run once on startup
(async () => {
  try {
    console.log("Running startup cleanup...");
    await cleanupExpiredAppointments();
  } catch (error) {
    console.error("Error running startup cleanup:", error);
  }
})();

// Run daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily cleanup job...");
  await cleanupExpiredAppointments();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  swaggerDocs(app, PORT);
});
