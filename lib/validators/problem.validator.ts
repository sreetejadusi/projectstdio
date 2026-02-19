import { z } from "zod";

export const createProblemSchema = z.object({
  title: z.string().min(3).max(180),
  difficulty: z.enum(["easy", "medium", "hard"]),
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

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
