import { z } from "zod";

const emailSchema = z
  .string()
  .email()
  .transform((value) => value.trim().toLowerCase());

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  role: z.enum(["student", "instructor", "admin"]).default("student"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export const resendConfirmationSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
