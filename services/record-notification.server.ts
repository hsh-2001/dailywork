import "server-only";

import { otRecordTable } from "@/db/tables/ot_records";
import { formatTime } from "@/utils/datetime";
import dayjs from "dayjs";
import { after } from "next/server";

const escapeTelegramHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const formatStatusLabel = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function formatRecordNotification(
  record: typeof otRecordTable.$inferSelect,
  action: "created" | "updated",
) {
  const duration = record.totalMinutes == null
    ? "In progress"
    : `${Math.floor(record.totalMinutes / 60)}h ${record.totalMinutes % 60}m`;
  const lines = [
    `<b>OVERTIME WORK LOG ${action === "created" ? "CREATED" : "UPDATED"}</b>`,
    "",
    "<blockquote>",
    `<b>Date:</b> ${escapeTelegramHtml(dayjs(record.workDate).format("ddd, MMM D, YYYY"))}`,
    `<b>Time:</b> ${escapeTelegramHtml(formatTime(record.startTime.toISOString()))} - ${record.endTime ? escapeTelegramHtml(formatTime(record.endTime.toISOString())) : "<i>In progress</i>"}`,
    `<b>Duration:</b> ${escapeTelegramHtml(duration)}`,
    "</blockquote>",
    `<b>Project:</b> ${escapeTelegramHtml(record.project || "—")}`,
    `<b>Task:</b> ${escapeTelegramHtml(record.task || "—")}`,
    `<b>Booking:</b> ${escapeTelegramHtml(formatStatusLabel(record.bookingStatus))}`,
    `<b>Submission:</b> ${escapeTelegramHtml(formatStatusLabel(record.submitStatus))}`,
  ];

  if (record.note) {
    lines.push("", "<b>Note</b>", escapeTelegramHtml(record.note));
  }
  lines.push("", "<i>OT Record</i>");
  return lines.join("\n");
}

export function notifyRecordChange(
  record: typeof otRecordTable.$inferSelect,
  action: "created" | "updated",
) {
  after(async () => {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const token = process.env.TELEGRAM_API_TOKEN;
    if (!chatId || !token) {
      console.error("Unable to send OT record notification: TELEGRAM_CHAT_ID or TELEGRAM_API_TOKEN is not configured");
      return;
    }

    try {
      const response = await fetch("https://api-center.shkh1601.workers.dev/telegram/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          text: formatRecordNotification(record, action),
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        console.error("Unable to send OT record notification", {
          status: response.status,
          statusText: response.statusText,
          requestId:
            response.headers.get("cf-ray") ??
            response.headers.get("x-request-id") ??
            undefined,
        });
      }
    } catch (error) {
      console.error("Unable to send OT record notification", error);
    }
  });
}
