import { sendTransactionalEmail } from "@/lib/email";

type SendContactInviteEmailInput = {
  to: string;
  inviterName: string;
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

export async function sendContactInviteEmail({ to, inviterName, actionUrl }: SendContactInviteEmailInput) {
  const subject = `${inviterName} wants to add you on Parqara`;
  const intro = `${inviterName} wants to save you as a contact on Parqara so sharing planners is easier.`;

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.6;padding:24px;background:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7e3;border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#0f766e;font-weight:700;">Saved contact invite</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">Create your Parqara account</h1>
        <p style="margin:0 0 20px;font-size:16px;color:#475569;">${escapeHtml(intro)}</p>
        <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Finish signup with this email and you will be added to their saved contacts automatically.</p>
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Create your account</a>
      </div>
    </div>
  `;

  const text = `${intro}\n\nFinish signup with this email and you will be added to their saved contacts automatically.\n\nCreate your account: ${actionUrl}`;

  return sendTransactionalEmail({
    to,
    subject,
    html,
    text,
  });
}
