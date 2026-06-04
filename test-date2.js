const { fromZonedTime, toZonedTime, format } = require("date-fns-tz");

const userTz = "Asia/Kolkata";
const cleanDate = "2026-06-04T12:00:00";

// What the server does to parse the AI output
const dueDate = fromZonedTime(cleanDate, userTz);
console.log("DB will save:", dueDate.toISOString());

// What the frontend does
const date = new Date(dueDate.toISOString());
console.log("Frontend toLocaleString (if browser in IST):", date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }));
