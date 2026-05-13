import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run alert generation every hour
crons.hourly(
  "generate-alerts",
  { minuteUTC: 0 }, // Run at the start of every hour
  internal.alertSystem.generateAlerts
);

// Clean up expired alerts daily at 2 AM UTC
crons.daily(
  "cleanup-alerts",
  { hourUTC: 2, minuteUTC: 0 },
  internal.alertSystem.cleanupExpiredAlerts
);

export default crons;