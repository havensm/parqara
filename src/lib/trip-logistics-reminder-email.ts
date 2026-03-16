import { sendTransactionalEmail } from "@/lib/email";

type SendTripLogisticsReminderEmailInput = {
  to: string;
  inviterName: string;
  tripName: string;
  actionUrl: string;
  tasks: string[];
  reminderNote?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTripLogisticsReminderEmail({
  to,
  inviterName,
  tripName,
  actionUrl,
  tasks,
  reminderNote,
}: SendTripLogisticsReminderEmailInput) {
  const taskPreview = tasks.slice(0, 4);
  const moreCount = Math.max(tasks.length - taskPreview.length, 0);
  const subject = `${inviterName} sent a reminder for ${tripName}`;
  const intro = `${inviterName} sent a quick reminder about your open trip logistics for ${tripName}.`;
  const noteLine = reminderNote?.trim() ? `Note from ${inviterName}: ${reminderNote.trim()}` : null;
  const taskLines = taskPreview.length ? taskPreview.map((task) => `<li style="margin:0 0 8px;">${escapeHtml(task)}</li>`).join("") : "<li style=\"margin:0;\">Open the planner to review what still needs attention.</li>";

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.6;padding:24px;background:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7e3;border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#0f766e;font-weight:700;">Trip reminder</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">${escapeHtml(tripName)}</h1>
        <p style="margin:0 0 16px;font-size:16px;color:#475569;">${escapeHtml(intro)}</p>
        ${noteLine ? `<p style="margin:0 0 20px;font-size:14px;color:#0f172a;">${escapeHtml(noteLine)}</p>` : ""}
        <ul style="margin:0 0 20px;padding-left:18px;font-size:14px;color:#475569;">${taskLines}</ul>
        ${moreCount ? `<p style="margin:0 0 20px;font-size:14px;color:#64748b;">Plus ${moreCount} more item${moreCount === 1 ? "" : "s"} in the planner.</p>` : ""}
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Open Parqara</a>
      </div>
    </div>
  `;

  const text = [
    intro,
    noteLine,
    taskPreview.length ? `Open items:\n- ${taskPreview.join("\n- ")}` : "Open the planner to review what still needs attention.",
    moreCount ? `Plus ${moreCount} more item${moreCount === 1 ? "" : "s"} in the planner.` : null,
    `Open Parqara: ${actionUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return sendTransactionalEmail({
    to,
    subject,
    html,
    text,
  });
}
