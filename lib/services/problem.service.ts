import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/AppError";
import type { CreateProblemInput } from "@/lib/validators/problem.validator";
import type { ProblemTestCase, UserRole } from "@/lib/types";

export class ProblemService {
  private readonly db = getSupabaseServerClient();

  async createProblem(
    input: CreateProblemInput,
    actor: { userId: string; role: UserRole },
  ) {
    if (actor.role !== "instructor" && actor.role !== "admin") {
      throw new AppError("Only instructors can create problems", 403, "FORBIDDEN");
    }

    const { data: problem, error } = await this.db
      .from("problems")
      .insert({
        title: input.title,
        difficulty: input.difficulty,
        created_by: actor.userId,
      })
      .select("id, title, difficulty, created_by, created_at")
      .single();

    if (error || !problem) {
      throw new AppError("Failed to create problem", 500, "PROBLEM_CREATE_FAILED", {
        postgresCode: error?.code,
      });
    }

    const inserts = input.languages.map((language) => ({
      problem_id: problem.id,
      language,
    }));

    const { error: languageError } = await this.db
      .from("problem_languages")
      .insert(inserts);

    if (languageError) {
      await this.db.from("problems").delete().eq("id", problem.id);
      throw new AppError("Failed to set problem languages", 500, "PROBLEM_LANGUAGE_CREATE_FAILED", {
        postgresCode: languageError.code,
      });
    }

    return {
      ...problem,
      languages: input.languages,
    };
  }

  async getProblemMetadata(problemId: string) {
    const { data: problem, error: problemError } = await this.db
      .from("problems")
      .select("id, title, difficulty, created_at")
      .eq("id", problemId)
      .maybeSingle();

    if (problemError) {
      throw new AppError("Failed to fetch problem", 500, "PROBLEM_FETCH_FAILED", {
        postgresCode: problemError.code,
      });
    }

    if (!problem) {
      throw new AppError("Problem does not exist", 404, "PROBLEM_NOT_FOUND");
    }

    const basePath = problem.id;
    const metadataPath = `${basePath}/problem.json`;

    const { data: file, error: fileError } = await this.db.storage
      .from("problems")
      .download(metadataPath);

    if (fileError || !file) {
      throw new AppError("Problem metadata file not found", 404, "PROBLEM_METADATA_NOT_FOUND", {
        path: metadataPath,
      });
    }

    const json = await file.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch {
      throw new AppError("Invalid problem metadata JSON", 500, "PROBLEM_METADATA_INVALID");
    }

    const { data: languages, error: languageError } = await this.db
      .from("problem_languages")
      .select("language")
      .eq("problem_id", problemId);

    if (languageError) {
      throw new AppError("Failed to fetch problem languages", 500, "PROBLEM_LANGUAGE_FETCH_FAILED", {
        postgresCode: languageError.code,
      });
    }

    return {
      ...problem,
      metadata: parsed,
      languages: languages.map((row) => row.language),
    };
  }

  async getProblemSolveData(
    problemId: string,
    classroomId?: string,
    selectedLanguage?: "c" | "java" | "python",
  ) {
    const { data: problem, error: problemError } = await this.db
      .from("problems")
      .select("id, title, difficulty")
      .eq("id", problemId)
      .maybeSingle();

    if (problemError) {
      throw new AppError("Failed to fetch problem", 500, "PROBLEM_FETCH_FAILED", {
        postgresCode: problemError.code,
      });
    }

    if (!problem) {
      throw new AppError("Problem does not exist", 404, "PROBLEM_NOT_FOUND");
    }

    const basePath = problem.id;
    const problemMetadata = await this.readJsonFromStorage<Record<string, unknown>>(
      `${basePath}/problem.json`,
    );
    const rawTestcases = await this.readJsonFromStorage<unknown>(
      `${basePath}/testcases.json`,
      true,
    );
    const flowchart = await this.readJsonFromStorage<Record<string, unknown> | null>(
      `${basePath}/flowchart.json`,
      true,
    );
    const testcases = this.extractTestcases(rawTestcases);

    const { data: problemLanguages, error: problemLanguageError } = await this.db
      .from("problem_languages")
      .select("language")
      .eq("problem_id", problemId);

    if (problemLanguageError) {
      throw new AppError("Failed to fetch problem languages", 500, "PROBLEM_LANGUAGE_FETCH_FAILED", {
        postgresCode: problemLanguageError.code,
      });
    }

    let allowedLanguages = problemLanguages.map((row) => row.language);

    if (classroomId) {
      const { data: classroomProblem, error: classroomProblemError } = await this.db
        .from("classroom_problems")
        .select("id")
        .eq("classroom_id", classroomId)
        .eq("problem_id", problemId)
        .maybeSingle();

      if (classroomProblemError) {
        throw new AppError("Failed to fetch classroom problem", 500, "CLASSROOM_PROBLEM_FETCH_FAILED", {
          postgresCode: classroomProblemError.code,
        });
      }

      if (!classroomProblem) {
        throw new AppError("Problem is not assigned to classroom", 404, "CLASSROOM_PROBLEM_NOT_ASSIGNED");
      }

      const { data: classroomLanguages, error: classroomLanguageError } = await this.db
        .from("classroom_problem_languages")
        .select("language")
        .eq("classroom_problem_id", classroomProblem.id);

      if (classroomLanguageError) {
        throw new AppError(
          "Failed to fetch classroom language restrictions",
          500,
          "CLASSROOM_LANGUAGE_FETCH_FAILED",
          {
            postgresCode: classroomLanguageError.code,
          },
        );
      }

      allowedLanguages = classroomLanguages.map((row) => row.language);
    }

    if (allowedLanguages.length === 0) {
      throw new AppError("No allowed languages configured for this problem", 400, "NO_ALLOWED_LANGUAGES");
    }

    const finalLanguage =
      selectedLanguage && allowedLanguages.includes(selectedLanguage)
        ? selectedLanguage
        : allowedLanguages[0];

    const runtime = await this.readJsonFromStorage<Record<string, unknown>>(
      `${basePath}/runtimes/${finalLanguage}/runtime.json`,
    );

    const entryFile = this.pickString(runtime.entry_file, "entry_file");
    const baseCodePath = `${basePath}/runtimes/${finalLanguage}/base_code/${entryFile}`;
    const baseCode = await this.readTextFromStorage(baseCodePath);

    return {
      id: problem.id,
      title: this.pickString(problemMetadata.title, "title", problem.title),
      difficulty: problem.difficulty,
      descriptionMarkdown: this.pickString(
        problemMetadata.description_markdown,
        "description_markdown",
        "",
      ),
      constraints: this.pickString(problemMetadata.constraints, "constraints", ""),
      testcases,
      languages: allowedLanguages,
      selectedLanguage: finalLanguage,
      runtime: {
        templateVersion: this.pickNumber(runtime.template_version, "template_version"),
        language: this.pickLanguage(runtime.language, "language"),
        entryFile,
        timeLimitMs: this.pickNumber(runtime.time_limit_ms, "time_limit_ms"),
        memoryLimitMb: this.pickNumber(runtime.memory_limit_mb, "memory_limit_mb"),
        cpuCores: this.pickNumber(runtime.cpu_cores, "cpu_cores"),
        allowNetwork: this.pickBoolean(runtime.allow_network, "allow_network"),
      },
      baseCode,
      flowchart: flowchart as unknown,
    };
  }

  private async readJsonFromStorage<T>(path: string, allowMissing = false): Promise<T> {
    const { data, error } = await this.db.storage.from("problems").download(path);
    if (error || !data) {
      if (allowMissing) {
        return null as T;
      }
      throw new AppError("Storage file not found", 404, "STORAGE_FILE_NOT_FOUND", { path });
    }

    const text = await data.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new AppError("Invalid JSON in storage file", 500, "INVALID_STORAGE_JSON", { path });
    }
  }

  private async readTextFromStorage(path: string): Promise<string> {
    const { data, error } = await this.db.storage.from("problems").download(path);
    if (error || !data) {
      throw new AppError("Storage file not found", 404, "STORAGE_FILE_NOT_FOUND", { path });
    }
    return data.text();
  }

  private pickString(value: unknown, key: string, fallback?: string): string {
    if (typeof value === "string") return value;
    if (typeof fallback === "string") return fallback;
    throw new AppError("Invalid problem metadata shape", 500, "INVALID_PROBLEM_METADATA", { key });
  }

  private pickNumber(value: unknown, key: string): number {
    if (typeof value === "number") return value;
    throw new AppError("Invalid runtime metadata shape", 500, "INVALID_RUNTIME_METADATA", { key });
  }

  private pickBoolean(value: unknown, key: string): boolean {
    if (typeof value === "boolean") return value;
    throw new AppError("Invalid runtime metadata shape", 500, "INVALID_RUNTIME_METADATA", { key });
  }

  private pickLanguage(value: unknown, key: string): "c" | "java" | "python" {
    if (value === "c" || value === "java" || value === "python") return value;
    throw new AppError("Invalid runtime metadata shape", 500, "INVALID_RUNTIME_METADATA", { key });
  }

  private extractTestcases(payload: unknown): ProblemTestCase[] {
    const rows = Array.isArray(payload)
      ? payload
      : this.pickObjectArray(payload, "testcases");

    return rows.map((item, index) => {
      const row = item as Record<string, unknown>;
      const id =
        typeof row.id === "string"
          ? row.id
          : typeof row.name === "string"
            ? row.name
            : `case-${index + 1}`;

      const visibility =
        row.visibility === "hidden" || row.hidden === true || row.is_hidden === true
          ? "hidden"
          : "visible";

      return {
        id,
        visibility,
        input: this.stringifyCaseValue(row.input ?? row.input_data ?? ""),
        expectedOutput: this.stringifyCaseValue(
          row.expected_output ?? row.expectedOutput ?? row.output ?? "",
        ),
      };
    });
  }

  private stringifyCaseValue(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value == null) return "";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  }

  private pickObjectArray(payload: unknown, key: string): unknown[] {
    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      if (Array.isArray(record[key])) {
        return record[key];
      }
    }
    return [];
  }
}

export const problemService = new ProblemService();
