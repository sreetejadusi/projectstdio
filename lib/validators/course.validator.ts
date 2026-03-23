import { z } from "zod";

const courseLanguageSchema = z.enum(["c", "java", "python"]);
const courseDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const courseTopicSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(""),
  url: z.string().nullable().default(null),
});

export const courseModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  codelab: z.string().nullable().default(null),
  topics: z.array(courseTopicSchema),
});

export const courseDocumentSchema = z.object({
  template: z.literal("v1"),
  version: z.number().int().nonnegative(),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  language: courseLanguageSchema,
  difficulty: courseDifficultySchema,
  modules: z.array(courseModuleSchema),
});

export const courseTopicProgressUpdateSchema = z.object({
  moduleId: z.string().min(1),
  topicId: z.string().min(1),
  completed: z.boolean().optional(),
});

export type CourseDocumentInput = z.infer<typeof courseDocumentSchema>;
export type CourseTopicProgressUpdateInput = z.infer<typeof courseTopicProgressUpdateSchema>;
