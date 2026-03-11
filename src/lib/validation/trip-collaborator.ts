import { z } from "zod";

export const tripCollaboratorInviteSchema = z.object({
  email: z.string().trim().email().max(320),
});
