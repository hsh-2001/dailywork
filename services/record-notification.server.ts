import "server-only";

import { otRecordTable } from "@/db/tables/ot_records";
import { formatTime } from "@/utils/datetime";
import dayjs from "dayjs";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const token = process.env.TELEGRAM_API_TOKEN;
  const apiCenter = process.env.API_CENTER;
  if (!chatId || !token || !apiCenter) {
    console.error("Unable to send OT record notification: API_CENTER, TELEGRAM_CHAT_ID, or TELEGRAM_API_TOKEN is not configured");
    return;
  }

  let endpoint: URL;
  try {
    const baseUrl = new URL(apiCenter);
    if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password) {
      throw new Error("API_CENTER must be an HTTPS URL without embedded credentials.");
    }
    endpoint = new URL("/telegram/send", baseUrl);
  } catch (error) {
    console.error("Unable to send OT record notification: API_CENTER is invalid", error);
    return;
  }

  try {
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(fetch(endpoint, {
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
      signal: AbortSignal.timeout(10_000),
    }).then((response) => {
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
    }).catch((error: unknown) => {
      console.error("Unable to send OT record notification", error);
    }));
  } catch (error) {
    console.error("Unable to schedule OT record notification", error);
  }
}
