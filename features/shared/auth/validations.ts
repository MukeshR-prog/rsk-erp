import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email or mobile number is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
