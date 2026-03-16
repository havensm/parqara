import { sendTransactionalEmail } from "@/lib/email";
import type { TripAccessRoleValue } from "@/lib/contracts";

type SendTripPersonInviteEmailInput = {
  to: string;
  inviterName: string;
  tripName: string;
  parkName: string;
  actionUrl: string;
  plannerAccessRole: TripAccessRoleValue;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getInviteCopy(plannerAccessRole: TripAccessRoleValue) {
  switch (plannerAccessRole) {
    case "EDIT":
      return {
        subjectLabel: "help edit the shared planner",
        accessLine: "They can open the planner, update shared details, and help keep the trip moving.",
      };
    case "VIEW":
      return {
        subjectLabel: "follow the shared planner",
        accessLine: "They can open the planner, see the shared trip, and work through their own logistics with Mara.",
      };
    default:
      return {
        subjectLabel: "track the trip logistics",
        accessLine: "They were added to the trip roster so logistics and reminders can stay in sync once they join.",
      };
  }
}

export async function sendTripPersonInviteEmail({
  to,
  inviterName,
  tripName,
  parkName,
  actionUrl,
  plannerAccessRole,
}: SendTripPersonInviteEmailInput) {
  const copy = getInviteCopy(plannerAccessRole);
  const subject = `${inviterName} invited you to ${tripName} on Parqara`;
  const intro = `${inviterName} invited you to ${copy.subjectLabel} for ${tripName} at ${parkName}.`;

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.6;padding:24px;background:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7e3;border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#0f766e;font-weight:700;">Trip invite</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">${escapeHtml(tripName)}</h1>
        <p style="margin:0 0 16px;font-size:16px;color:#475569;">${escapeHtml(intro)}</p>
        <p style="margin:0 0 20px;font-size:14px;color:#64748b;">${escapeHtml(copy.accessLine)}</p>
        <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Destination: ${escapeHtml(parkName)}</p>
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Create your account</a>
      </div>
    </div>
  `;

  const text = `${intro}\n\n${copy.accessLine}\n\nDestination: ${parkName}\n\nCreate your account: ${actionUrl}`;

  return sendTransactionalEmail({
    to,
    subject,
    html,
    text,
  });
}
