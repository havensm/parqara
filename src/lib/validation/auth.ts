import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export const emailLinkSchema = z.object({
  email: z.string().email(),
  intent: z.enum(["signin", "signup"]).default("signup"),
});
