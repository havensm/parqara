export const ADMIN_EMAIL = "havensm09@gmail.com";

export function isAdminEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;
}
