import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/AppError";
import type {
  CourseCatalogItem,
  CourseDetail,
  CourseDocument,
  CourseEnrollment,
  CourseTopicProgressEntry,
} from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";
import { courseDocumentSchema } from "@/lib/validators/course.validator";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  language: "c" | "java" | "python" | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  storage_path: string;
  thumbnail_url: string | null;
  estimated_hours: number | null;
  is_published: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type CourseEnrollmentRow = {
  progress_percent: number | null;
  started_at: string | null;
  last_accessed_at: string | null;
  completed_at: string | null;
};

type CourseTopicProgressRow = {
  module_id: string;
  topic_id: string;
  completed: boolean | null;
  completed_at: string | null;
  last_viewed_at: string | null;
};

type CourseTables = {
  courses: {
    Row: CourseRow;
    Insert: Omit<CourseRow, "created_at" | "updated_at"> & {
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<CourseRow>;
    Relationships: [];
  };
  course_enrollments: {
    Row: {
      id: string;
      user_id: string;
      course_id: string;
      progress_percent: number | null;
      started_at: string | null;
      last_accessed_at: string | null;
      completed_at: string | null;
    };
    Insert: {
      id?: string;
      user_id: string;
      course_id: string;
      progress_percent?: number | null;
      started_at?: string | null;
      last_accessed_at?: string | null;
      completed_at?: string | null;
    };
    Update: {
      id?: string;
      user_id?: string;
      course_id?: string;
      progress_percent?: number | null;
      started_at?: string | null;
      last_accessed_at?: string | null;
      completed_at?: string | null;
    };
    Relationships: [];
  };
  course_topic_progress: {
    Row: {
      id: string;
      user_id: string;
      course_id: string;
      module_id: string;
      topic_id: string;
      completed: boolean | null;
      completed_at: string | null;
      last_viewed_at: string | null;
    };
    Insert: {
      id?: string;
      user_id: string;
      course_id: string;
      module_id: string;
      topic_id: string;
      completed?: boolean | null;
      completed_at?: string | null;
      last_viewed_at?: string | null;
    };
    Update: {
      id?: string;
      user_id?: string;
      course_id?: string;
      module_id?: string;
      topic_id?: string;
      completed?: boolean | null;
      completed_at?: string | null;
      last_viewed_at?: string | null;
    };
    Relationships: [];
  };
};

type CourseDatabase = Database & {
  public: {
    Tables: Database["public"]["Tables"] & CourseTables;
  };
};

export class CourseService {
  private readonly db = getSupabaseServerClient() as unknown as SupabaseClient<CourseDatabase>;

  async listCoursesForUser(userId: string): Promise<CourseCatalogItem[]> {
    const { data: rows, error } = await this.db
      .from("courses")
      .select("id, slug, title, description, language, difficulty, storage_path, thumbnail_url, estimated_hours, is_published, created_by, created_at, updated_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError("Failed to fetch courses", 500, "COURSE_FETCH_FAILED", {
        postgresCode: error.code,
      });
    }

    const courseRows = (rows ?? []) as CourseRow[];
    if (courseRows.length === 0) {
      return [];
    }

    const courseIds = courseRows.map((row) => row.id);
    const [enrollmentByCourseId, documentsByCourseId] = await Promise.all([
      this.getEnrollmentsByCourseId(userId, courseIds),
      this.getDocumentsByCourseId(courseRows),
    ]);

    return courseRows.map((row) => {
      const document = documentsByCourseId.get(row.id);
      const enrollment = enrollmentByCourseId.get(row.id);
      const topicCount = document?.modules.reduce((sum, courseModule) => sum + courseModule.topics.length, 0) ?? 0;

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        language: row.language,
        difficulty: row.difficulty,
        thumbnailUrl: row.thumbnail_url,
        estimatedHours: row.estimated_hours,
        isPublished: Boolean(row.is_published),
        topicCount,
        moduleCount: document?.modules.length ?? 0,
        progressPercent: enrollment?.progress_percent ?? 0,
        lastAccessedAt: enrollment?.last_accessed_at ?? null,
      };
    });
  }

  async getCourseDetailForUser(userId: string, slug: string): Promise<CourseDetail> {
    const { data, error } = await this.db
      .from("courses")
      .select("id, slug, title, description, language, difficulty, storage_path, thumbnail_url, estimated_hours, is_published, created_by, created_at, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to fetch course", 500, "COURSE_FETCH_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!data) {
      throw new AppError("Course does not exist", 404, "COURSE_NOT_FOUND");
    }

    const row = data as CourseRow;
    if (!row.is_published) {
      throw new AppError("Course is not published", 404, "COURSE_NOT_FOUND");
    }

    const document = await this.downloadCourseDocument(row.storage_path);
    const topicProgress = await this.getTopicProgress(userId, row.id);
    const enrollment = await this.getEnrollment(userId, row.id);
    const topicCount = document.modules.reduce((sum, courseModule) => sum + courseModule.topics.length, 0);

    return {
      course: {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        language: row.language,
        difficulty: row.difficulty,
        thumbnailUrl: row.thumbnail_url,
        estimatedHours: row.estimated_hours,
        isPublished: Boolean(row.is_published),
        topicCount,
        moduleCount: document.modules.length,
        progressPercent: enrollment?.progressPercent ?? 0,
        lastAccessedAt: enrollment?.lastAccessedAt ?? null,
        storagePath: row.storage_path,
        document,
      },
      enrollment,
      topicProgress,
    };
  }

  async trackTopicView(userId: string, slug: string, moduleId: string, topicId: string) {
    const detail = await this.getCourseDetailForUser(userId, slug);
    this.ensureTopicExists(detail.course.document, moduleId, topicId);

    await this.ensureEnrollment(userId, detail.course.id);

    const now = new Date().toISOString();

    const { error: topicError } = await this.db
      .from("course_topic_progress")
      .upsert({
        user_id: userId,
        course_id: detail.course.id,
        module_id: moduleId,
        topic_id: topicId,
        last_viewed_at: now,
      }, { onConflict: "user_id,course_id,module_id,topic_id" });

    if (topicError) {
      throw new AppError("Failed to update topic progress", 500, "COURSE_PROGRESS_UPDATE_FAILED", {
        postgresCode: topicError.code,
      });
    }

    const { error: enrollmentError } = await this.db
      .from("course_enrollments")
      .update({ last_accessed_at: now })
      .eq("user_id", userId)
      .eq("course_id", detail.course.id);

    if (enrollmentError) {
      throw new AppError("Failed to update enrollment progress", 500, "COURSE_ENROLLMENT_UPDATE_FAILED", {
        postgresCode: enrollmentError.code,
      });
    }

    return this.getCourseDetailForUser(userId, slug);
  }

  async completeTopic(userId: string, slug: string, moduleId: string, topicId: string) {
    const detail = await this.getCourseDetailForUser(userId, slug);
    this.ensureTopicExists(detail.course.document, moduleId, topicId);

    await this.ensureEnrollment(userId, detail.course.id);

    const now = new Date().toISOString();

    const { error: topicError } = await this.db
      .from("course_topic_progress")
      .upsert({
        user_id: userId,
        course_id: detail.course.id,
        module_id: moduleId,
        topic_id: topicId,
        completed: true,
        completed_at: now,
        last_viewed_at: now,
      }, { onConflict: "user_id,course_id,module_id,topic_id" });

    if (topicError) {
      throw new AppError("Failed to complete topic", 500, "COURSE_PROGRESS_UPDATE_FAILED", {
        postgresCode: topicError.code,
      });
    }

    const progressRows = await this.getTopicProgress(userId, detail.course.id);
    const totalTopics = detail.course.document.modules.reduce((sum, courseModule) => sum + courseModule.topics.length, 0);
    const completedCount = progressRows.filter((row) => row.completed).length;
    const progressPercent = totalTopics === 0 ? 0 : Math.min(100, Math.round((completedCount / totalTopics) * 100));

    const enrollmentUpdate: Record<string, unknown> = {
      progress_percent: progressPercent,
      last_accessed_at: now,
    };

    if (progressPercent === 100) {
      enrollmentUpdate.completed_at = now;
    }

    const { error: enrollmentError } = await this.db
      .from("course_enrollments")
      .update(enrollmentUpdate)
      .eq("user_id", userId)
      .eq("course_id", detail.course.id);

    if (enrollmentError) {
      throw new AppError("Failed to update course progress", 500, "COURSE_ENROLLMENT_UPDATE_FAILED", {
        postgresCode: enrollmentError.code,
      });
    }

    return this.getCourseDetailForUser(userId, slug);
  }

  private async getDocumentsByCourseId(rows: CourseRow[]) {
    const entries = await Promise.all(
      rows.map(async (row) => {
        try {
          const document = await this.downloadCourseDocument(row.storage_path);
          return [row.id, document] as const;
        } catch {
          return [row.id, null] as const;
        }
      }),
    );

    return new Map(entries);
  }

  private async getEnrollmentsByCourseId(userId: string, courseIds: string[]) {
    const { data, error } = await this.db
      .from("course_enrollments")
      .select("course_id, progress_percent, last_accessed_at")
      .eq("user_id", userId)
      .in("course_id", courseIds);

    if (error) {
      throw new AppError("Failed to fetch course enrollments", 500, "COURSE_ENROLLMENT_FETCH_FAILED", {
        postgresCode: error.code,
      });
    }

    return new Map(
      ((data ?? []) as Array<{ course_id: string; progress_percent: number | null; last_accessed_at: string | null }>).map((row) => [
        row.course_id,
        row,
      ]),
    );
  }

  private async getEnrollment(userId: string, courseId: string): Promise<CourseEnrollment | null> {
    const { data, error } = await this.db
      .from("course_enrollments")
      .select("progress_percent, started_at, last_accessed_at, completed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to fetch course enrollment", 500, "COURSE_ENROLLMENT_FETCH_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!data) {
      return null;
    }

    const row = data as CourseEnrollmentRow;
    return {
      progressPercent: row.progress_percent ?? 0,
      startedAt: row.started_at,
      lastAccessedAt: row.last_accessed_at,
      completedAt: row.completed_at,
    };
  }

  private async getTopicProgress(userId: string, courseId: string): Promise<CourseTopicProgressEntry[]> {
    const { data, error } = await this.db
      .from("course_topic_progress")
      .select("module_id, topic_id, completed, completed_at, last_viewed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId);

    if (error) {
      throw new AppError("Failed to fetch topic progress", 500, "COURSE_PROGRESS_FETCH_FAILED", {
        postgresCode: error.code,
      });
    }

    return ((data ?? []) as CourseTopicProgressRow[]).map((row) => ({
      moduleId: row.module_id,
      topicId: row.topic_id,
      completed: Boolean(row.completed),
      completedAt: row.completed_at,
      lastViewedAt: row.last_viewed_at,
    }));
  }

  private async ensureEnrollment(userId: string, courseId: string) {
    const { data, error: fetchError } = await this.db
      .from("course_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (fetchError) {
      throw new AppError("Failed to fetch course enrollment", 500, "COURSE_ENROLLMENT_FETCH_FAILED", {
        postgresCode: fetchError.code,
      });
    }

    if (data) {
      return;
    }

    const now = new Date().toISOString();
    const { error } = await this.db
      .from("course_enrollments")
      .insert({
        user_id: userId,
        course_id: courseId,
        progress_percent: 0,
        started_at: now,
        last_accessed_at: now,
      });

    if (error) {
      throw new AppError("Failed to create course enrollment", 500, "COURSE_ENROLLMENT_CREATE_FAILED", {
        postgresCode: error.code,
      });
    }
  }

  private ensureTopicExists(document: CourseDocument, moduleId: string, topicId: string) {
    const courseModule = document.modules.find((item) => item.id === moduleId);
    if (!courseModule) {
      throw new AppError("Course module does not exist", 404, "COURSE_MODULE_NOT_FOUND");
    }

    const topic = courseModule.topics.find((item) => item.id === topicId);
    if (!topic) {
      throw new AppError("Course topic does not exist", 404, "COURSE_TOPIC_NOT_FOUND");
    }
  }

  private async downloadCourseDocument(storagePath: string): Promise<CourseDocument> {
    const objectPath = this.toStorageObjectPath(storagePath);
    const { data, error } = await this.db.storage.from("courses").download(objectPath);

    if (error || !data) {
      throw new AppError("Course content file not found", 404, "COURSE_STORAGE_NOT_FOUND", {
        path: storagePath,
      });
    }

    const text = await data.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AppError("Invalid course JSON", 500, "COURSE_JSON_INVALID", {
        path: storagePath,
      });
    }

    if ((parsed as { template?: string } | null)?.template !== "v1") {
      throw new AppError("Unsupported course template version", 400, "COURSE_TEMPLATE_UNSUPPORTED");
    }

    const result = courseDocumentSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError("Course JSON does not match template", 500, "COURSE_JSON_SCHEMA_INVALID", {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }

  private toStorageObjectPath(storagePath: string) {
    if (!storagePath.startsWith("courses/")) {
      throw new AppError("Invalid course storage path", 500, "COURSE_STORAGE_PATH_INVALID", {
        path: storagePath,
      });
    }

    return storagePath.slice("courses/".length);
  }
}

export const courseService = new CourseService();
