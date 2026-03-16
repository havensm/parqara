import { z } from "zod";

const tripAccessRoleSchema = z.enum(["NONE", "VIEW", "EDIT"]);
const tripAttendanceStatusSchema = z.enum(["INVITED", "ATTENDING", "MAYBE", "NOT_ATTENDING"]);

export const tripPersonCreateSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(80).optional(),
  plannerAccessRole: tripAccessRoleSchema.default("VIEW"),
  attendanceStatus: tripAttendanceStatusSchema.default("INVITED"),
});

export const tripPersonUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    plannerAccessRole: tripAccessRoleSchema.optional(),
    attendanceStatus: tripAttendanceStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one update is required.",
  });

export const tripPersonReminderSchema = z.object({
  note: z.string().trim().max(240).optional(),
});
