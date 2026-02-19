import { z } from "zod";

export const createClassroomSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(120),
});

export const addClassroomMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["student", "instructor"]),
});

export const assignProblemSchema = z.object({
  problemId: z.string().uuid(),
  languages: z.array(z.enum(["c", "java", "python"]))
    .min(1)
    .superRefine((value, ctx) => {
      if (new Set(value).size !== value.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "languages must be unique",
        });
      }
    }),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type AddClassroomMemberInput = z.infer<typeof addClassroomMemberSchema>;
export type AssignProblemInput = z.infer<typeof assignProblemSchema>;
