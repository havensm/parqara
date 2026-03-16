import { sendTransactionalEmail, isEmailDeliveryConfigured } from "@/lib/email";

type SendTripFinalizedPlanEmailInput = {
  to: string;
  tripName: string;
  destination: string | null;
  dateLabel: string;
  latestTakeaway: string | null;
  activities: string[];
  supplies: string[];
  actionUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTripFinalizedPlanEmail({
  to,
  tripName,
  destination,
  dateLabel,
  latestTakeaway,
  activities,
  supplies,
  actionUrl,
}: SendTripFinalizedPlanEmailInput) {
  if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
    return { delivery: "preview", provider: "preview" as const };
  }

  const activityPreview = activities.slice(0, 5);
  const supplyPreview = supplies.slice(0, 6);
  const subject = `${tripName} is finalized on Parqara`;
  const intro = latestTakeaway?.trim() || `The finalized plan for ${tripName} is ready to review.`;

  const activityItems = activityPreview.length
    ? activityPreview.map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`).join("")
    : "<li style=\"margin:0;\">Open the finalized plan to see the full route and trip details.</li>";

  const supplyItems = supplyPreview.length
    ? supplyPreview.map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`).join("")
    : "<li style=\"margin:0;\">Mara will keep the final bring list attached to the plan.</li>";

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.6;padding:24px;background:#f8fafc;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dbe7e3;border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#0f766e;font-weight:700;">Final trip report</p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;">${escapeHtml(tripName)}</h1>
        <p style="margin:0 0 16px;font-size:16px;color:#475569;">${escapeHtml(intro)}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#64748b;">${escapeHtml(destination ? `${destination} · ${dateLabel}` : dateLabel)}</p>
        <div style="margin:24px 0 0;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;font-weight:700;">Planned highlights</p>
          <ul style="margin:0;padding-left:18px;font-size:14px;color:#475569;">${activityItems}</ul>
        </div>
        <div style="margin:24px 0 0;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;font-weight:700;">Bring list</p>
          <ul style="margin:0;padding-left:18px;font-size:14px;color:#475569;">${supplyItems}</ul>
        </div>
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;margin-top:28px;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Open the finalized plan</a>
      </div>
    </div>
  `;

  const text = [
    intro,
    destination ? `${destination} · ${dateLabel}` : dateLabel,
    activityPreview.length ? `Planned highlights:\n- ${activityPreview.join("\n- ")}` : null,
    supplyPreview.length ? `Bring list:\n- ${supplyPreview.join("\n- ")}` : null,
    `Open the finalized plan: ${actionUrl}`,
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
