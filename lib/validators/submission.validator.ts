import { z } from "zod";

export const createSubmissionSchema = z.object({
  problemId: z.string().uuid(),
  classroomId: z.string().uuid(),
  language: z.enum(["c", "java", "python"]),
  code: z.string().min(1).max(200000),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
