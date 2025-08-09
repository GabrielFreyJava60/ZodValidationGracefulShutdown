import { z } from "zod";

export const EmployeeCreateSchema = z.object({
  id: z.string().min(1).optional(),
  fullName: z.string().min(1, "fullName is required"),
  avatar: z
    .string()
    .trim()
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v === "" || /^https?:\/\//i.test(v), {
      message: "avatar must be a URL or empty",
    }),
  department: z.string().min(1, "department is required"),
  birthDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), { message: "birthDate must be ISO date string" }),
  salary: z.coerce.number().finite().nonnegative(),
});

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

export type EmployeeCreateInput = z.infer<typeof EmployeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateSchema>;


