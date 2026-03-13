import { sendTransactionalEmail } from "@/lib/email";

type SendPlannerInviteEmailInput = {
  to: string;
  inviterName: string;
  tripName: string;
  parkName: string;
  actionUrl: string;
  requiresAccount: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendPlannerInviteEmail({
  to,
  inviterName,
  tripName,
  parkName,
  actionUrl,
  requiresAccount,
}: SendPlannerInviteEmailInput) {
  const subject = requiresAccount
    ? `${inviterName} invited you to ${tripName} on Parqara`
    : `${inviterName} added you to ${tripName}`;
  const actionLabel = requiresAccount ? "Create your account" : "Open the planner";
  const bodyIntro = requiresAccount
    ? `${inviterName} invited you to collaborate on ${tripName} at ${parkName}. Create a Parqara account with this email to unlock the planner.`
    : `${inviterName} added you to ${tripName} at ${parkName}. You can open the planner now and start collaborating.`;

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.6;padding:24px;background:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7e3;border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#0f766e;font-weight:700;">Planner invite</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">${escapeHtml(tripName)}</h1>
        <p style="margin:0 0 20px;font-size:16px;color:#475569;">${escapeHtml(bodyIntro)}</p>
        <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Trip destination: ${escapeHtml(parkName)}</p>
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">${escapeHtml(actionLabel)}</a>
      </div>
    </div>
  `;

  const text = `${bodyIntro}\n\nTrip destination: ${parkName}\n\n${actionLabel}: ${actionUrl}`;

  return sendTransactionalEmail({
    to,
    subject,
    html,
    text,
  });
}
