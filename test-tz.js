const tz = "Asia/Kolkata";
const now = new Date("2026-06-04T04:30:00Z"); // 10:00 AM IST
const timeStr = now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
console.log("timeStr for Asia/Kolkata:", timeStr);

const tz2 = "UTC";
const timeStr2 = now.toLocaleTimeString("en-US", { timeZone: tz2, hour: "2-digit", minute: "2-digit", hour12: true });
console.log("timeStr for UTC:", timeStr2);
