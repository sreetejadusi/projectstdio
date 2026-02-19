import { randomUUID } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/AppError";
import type { CreateSubmissionInput } from "@/lib/validators/submission.validator";
import { classroomService } from "@/lib/services/classroom.service";
import { buildSubmissionBasePath } from "@/lib/utils/storage";

export class SubmissionService {
  private readonly db = getSupabaseServerClient();

  async createSubmission(input: CreateSubmissionInput, actor: { userId: string }) {
    await classroomService.ensureClassroomMembership(input.classroomId, actor.userId);

    const { data: classroomProblem, error: classroomProblemError } = await this.db
      .from("classroom_problems")
      .select("id")
      .eq("classroom_id", input.classroomId)
      .eq("problem_id", input.problemId)
      .maybeSingle();

    if (classroomProblemError) {
      throw new AppError("Failed to validate classroom problem", 500, "CLASSROOM_PROBLEM_FETCH_FAILED", {
        postgresCode: classroomProblemError.code,
      });
    }

    if (!classroomProblem) {
      throw new AppError("Problem is not assigned to classroom", 400, "CLASSROOM_PROBLEM_NOT_ASSIGNED");
    }

    const { data: allowedLanguage, error: languageError } = await this.db
      .from("classroom_problem_languages")
      .select("id")
      .eq("classroom_problem_id", classroomProblem.id)
      .eq("language", input.language)
      .maybeSingle();

    if (languageError) {
      throw new AppError("Failed to validate submission language", 500, "SUBMISSION_LANGUAGE_CHECK_FAILED", {
        postgresCode: languageError.code,
      });
    }

    if (!allowedLanguage) {
      throw new AppError("Language is not allowed for this classroom problem", 400, "LANGUAGE_NOT_ALLOWED");
    }

    const submissionId = randomUUID();
    const submissionBase = buildSubmissionBasePath(submissionId);
    const codePath = `${submissionBase}/code/main.${this.getExtension(input.language)}`;
    const dataPath = `${submissionBase}/submission_data.json`;

    const { error: uploadCodeError } = await this.db.storage
      .from("submissions")
      .upload(codePath, Buffer.from(input.code, "utf8"), {
        upsert: false,
        contentType: "text/plain",
      });

    if (uploadCodeError) {
      throw new AppError("Failed to upload submission code", 500, "SUBMISSION_CODE_UPLOAD_FAILED", {
        storageError: uploadCodeError.message,
      });
    }

    const dataPayload = {
      template_version: 1,
      status: "queued",
      created_at: new Date().toISOString(),
      language: input.language,
    };

    const { error: uploadDataError } = await this.db.storage
      .from("submissions")
      .upload(dataPath, Buffer.from(JSON.stringify(dataPayload), "utf8"), {
        upsert: false,
        contentType: "application/json",
      });

    if (uploadDataError) {
      await this.db.storage.from("submissions").remove([codePath]);
      throw new AppError("Failed to upload submission metadata", 500, "SUBMISSION_DATA_UPLOAD_FAILED", {
        storageError: uploadDataError.message,
      });
    }

    const { data: submission, error } = await this.db
      .from("submissions")
      .insert({
        id: submissionId,
        user_id: actor.userId,
        problem_id: input.problemId,
        classroom_id: input.classroomId,
        language: input.language,
        submission_code_path: `/${codePath}`,
        submission_data_file_path: `/${dataPath}`,
      })
      .select("id")
      .single();

    if (error || !submission) {
      await this.db.storage.from("submissions").remove([codePath, dataPath]);
      throw new AppError("Failed to create submission", 500, "SUBMISSION_CREATE_FAILED", {
        postgresCode: error?.code,
      });
    }

    return {
      id: submission.id,
      problemId: input.problemId,
      classroomId: input.classroomId,
      language: input.language,
      submissionCodePath: `/${codePath}`,
      submissionDataFilePath: `/${dataPath}`,
    };
  }

  private getExtension(language: "c" | "java" | "python") {
    if (language === "python") return "py";
    if (language === "java") return "java";
    return "c";
  }
}

export const submissionService = new SubmissionService();
