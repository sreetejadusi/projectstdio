import { randomUUID } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/AppError";
import type { CreateSubmissionInput } from "@/lib/validators/submission.validator";
import { classroomService } from "@/lib/services/classroom.service";
import { buildSubmissionBasePath } from "@/lib/utils/storage";

const CODE_EXTENSION_BY_LANGUAGE = {
  python: "py",
  java: "java",
  c: "c",
} as const;

export class SubmissionService {
  private readonly db = getSupabaseServerClient();

  async listForUserProblem(userId: string, problemId: string) {
    const { data, error } = await this.db
      .from("submissions")
      .select("id, problem_id, classroom_id, language, submitted_at, submission_path, acceptance")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .order("submitted_at", { ascending: false });

    if (error) {
      throw new AppError("Failed to fetch submissions", 500, "SUBMISSION_LIST_FAILED", {
        postgresCode: error.code,
      });
    }

    return data.map((submission) => ({
      id: submission.id,
      problemId: submission.problem_id,
      classroomId: submission.classroom_id,
      language: submission.language,
      submittedAt: submission.submitted_at,
      submissionPath: submission.submission_path,
      acceptance: submission.acceptance,
    }));
  }

  async getSubmissionForUser(userId: string, submissionId: string) {
    const { data: submission, error } = await this.db
      .from("submissions")
      .select("id, problem_id, classroom_id, language, submitted_at, submission_path, acceptance")
      .eq("user_id", userId)
      .eq("id", submissionId)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to fetch submission", 500, "SUBMISSION_FETCH_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!submission) {
      throw new AppError("Submission not found", 404, "SUBMISSION_NOT_FOUND");
    }

    const submissionBasePath = submission.submission_path.replace(/^\//, "");
    const codePath = `${submissionBasePath}/code.${CODE_EXTENSION_BY_LANGUAGE[submission.language]}`;
    const metadataPath = `${submissionBasePath}/metadata.json`;

    const { data: submissionFile, error: submissionFileError } = await this.db.storage
      .from("submissions")
      .download(codePath);

    if (submissionFileError || !submissionFile) {
      throw new AppError("Failed to read submission code", 500, "SUBMISSION_READ_FAILED");
    }

    const code = await submissionFile.text();

    const { data: metadataFile, error: metadataFileError } = await this.db.storage
      .from("submissions")
      .download(metadataPath);

    let metadata: Record<string, unknown> | null = null;
    if (!metadataFileError && metadataFile) {
      try {
        metadata = JSON.parse(await metadataFile.text()) as Record<string, unknown>;
      } catch {
        metadata = null;
      }
    }

    return {
      id: submission.id,
      problemId: submission.problem_id,
      classroomId: submission.classroom_id,
      language: submission.language,
      submittedAt: submission.submitted_at,
      submissionPath: submission.submission_path,
      acceptance: submission.acceptance,
      code,
      metadata,
    };
  }

  async deleteSubmissionForUser(userId: string, submissionId: string) {
    const { data: submission, error: fetchError } = await this.db
      .from("submissions")
      .select("id, submission_path, language")
      .eq("user_id", userId)
      .eq("id", submissionId)
      .maybeSingle();

    if (fetchError) {
      throw new AppError("Failed to fetch submission", 500, "SUBMISSION_FETCH_FAILED", {
        postgresCode: fetchError.code,
      });
    }

    if (!submission) {
      throw new AppError("Submission not found", 404, "SUBMISSION_NOT_FOUND");
    }

    const submissionBasePath = submission.submission_path.replace(/^\//, "");
    const paths = [
      `${submissionBasePath}/code.${CODE_EXTENSION_BY_LANGUAGE[submission.language]}`,
      `${submissionBasePath}/metadata.json`,
      `${submissionBasePath}/activity.jsonl`,
    ];

    const { error: deleteError } = await this.db
      .from("submissions")
      .delete()
      .eq("user_id", userId)
      .eq("id", submissionId);

    if (deleteError) {
      throw new AppError("Failed to delete submission", 500, "SUBMISSION_DELETE_FAILED", {
        postgresCode: deleteError.code,
      });
    }

    await this.db.storage.from("submissions").remove(paths);

    return { deleted: true, submissionId };
  }

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
    const submissionBasePath = buildSubmissionBasePath(actor.userId, submissionId);
    const codePath = `${submissionBasePath}/code.${CODE_EXTENSION_BY_LANGUAGE[input.language]}`;
    const metadataPath = `${submissionBasePath}/metadata.json`;

    const metadataPayload = {
      passed: 0,
      total: 0,
      acceptance: null,
      language: input.language,
      status: "queued",
      created_at: new Date().toISOString(),
    };

    const { error: uploadCodeError } = await this.db.storage
      .from("submissions")
      .upload(codePath, Buffer.from(input.code, "utf8"), {
        upsert: false,
        contentType: "text/plain; charset=utf-8",
      });

    if (uploadCodeError) {
      throw new AppError("Failed to upload submission code", 500, "SUBMISSION_CODE_UPLOAD_FAILED", {
        storageError: uploadCodeError.message,
      });
    }

    const { error: uploadMetadataError } = await this.db.storage
      .from("submissions")
      .upload(metadataPath, Buffer.from(JSON.stringify(metadataPayload), "utf8"), {
        upsert: false,
        contentType: "application/json",
      });

    if (uploadMetadataError) {
      await this.db.storage.from("submissions").remove([codePath]);
      throw new AppError("Failed to upload submission metadata", 500, "SUBMISSION_DATA_UPLOAD_FAILED", {
        storageError: uploadMetadataError.message,
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
        submission_path: submissionBasePath,
        acceptance: null,
      })
      .select("id")
      .single();

    if (error || !submission) {
      await this.db.storage.from("submissions").remove([codePath, metadataPath]);
      throw new AppError("Failed to create submission", 500, "SUBMISSION_CREATE_FAILED", {
        postgresCode: error?.code,
      });
    }

    return {
      id: submission.id,
      problemId: input.problemId,
      classroomId: input.classroomId,
      language: input.language,
      submissionPath: submissionBasePath,
      acceptance: null,
    };
  }
}

export const submissionService = new SubmissionService();
