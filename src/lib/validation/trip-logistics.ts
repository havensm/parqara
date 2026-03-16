import { z } from "zod";

const logisticsCategorySchema = z.enum(["DOCS", "TRANSPORT", "GEAR", "TIME_OFF", "LODGING", "OTHER"]);
const logisticsStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]);

const dueDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Due date must be a valid ISO date.",
  });

export const createTripLogisticsTaskSchema = z.object({
  mode: z.literal("manual").default("manual"),
  assigneePersonId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(3).max(140),
  category: logisticsCategorySchema.default("OTHER"),
  dueDate: dueDateSchema,
  note: z.string().trim().max(280).optional(),
});

export const createTripLogisticsSuggestionsSchema = z.object({
  mode: z.literal("suggestions"),
});

export const tripLogisticsCreateSchema = z.union([
  createTripLogisticsTaskSchema,
  createTripLogisticsSuggestionsSchema,
]);

export const tripLogisticsUpdateSchema = z
  .object({
    assigneePersonId: z.string().trim().min(1).max(200).optional(),
    title: z.string().trim().min(3).max(140).optional(),
    category: logisticsCategorySchema.optional(),
    status: logisticsStatusSchema.optional(),
    dueDate: dueDateSchema,
    note: z.string().trim().max(280).nullable().optional(),
    reminderNote: z.string().trim().max(240).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one update is required.",
  });

export const tripLogisticsReminderSchema = z.object({
  note: z.string().trim().max(240).optional(),
});
