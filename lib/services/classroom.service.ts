import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/AppError";
import type {
  AddClassroomMemberInput,
  AssignProblemInput,
  CreateClassroomInput,
} from "@/lib/validators/classroom.validator";
import type { ClassroomDetail, UserRole } from "@/lib/types";

export class ClassroomService {
  private readonly db = getSupabaseServerClient();

  async getClassroomDetailForUser(userId: string, classroomId: string): Promise<ClassroomDetail> {
    const { data: membership, error: membershipError } = await this.db
      .from("classroom_members")
      .select("role")
      .eq("classroom_id", classroomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) {
      throw new AppError("Failed to fetch classroom", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: membershipError.code,
      });
    }

    if (!membership) {
      throw new AppError("Classroom does not exist", 404, "CLASSROOM_NOT_FOUND");
    }

    const { data: classroom, error: classroomError } = await this.db
      .from("classrooms")
      .select("id, name")
      .eq("id", classroomId)
      .maybeSingle();

    if (classroomError) {
      throw new AppError("Failed to fetch classroom", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: classroomError.code,
      });
    }

    if (!classroom) {
      throw new AppError("Classroom does not exist", 404, "CLASSROOM_NOT_FOUND");
    }

    const { data: classroomProblems, error: classroomProblemsError } = await this.db
      .from("classroom_problems")
      .select("problem_id")
      .eq("classroom_id", classroomId);

    if (classroomProblemsError) {
      throw new AppError("Failed to fetch classroom problems", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: classroomProblemsError.code,
      });
    }

    const problemIds = classroomProblems.map((row) => row.problem_id);

    const problems = problemIds.length
      ? await this.getProblemsWithLanguage(problemIds)
      : [];

    const { data: members, error: membersError } = await this.db
      .from("classroom_members")
      .select("user_id")
      .eq("classroom_id", classroomId);

    if (membersError) {
      throw new AppError("Failed to fetch classroom members", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: membersError.code,
      });
    }

    const memberIds = members.map((row) => row.user_id);

    const students = memberIds.length
      ? await this.getStudents(memberIds)
      : [];

    return {
      id: classroom.id,
      name: classroom.name,
      role: membership.role,
      problems,
      students,
    };
  }

  async listForUser(userId: string) {
    const { data: memberships, error: membershipError } = await this.db
      .from("classroom_members")
      .select("classroom_id, role")
      .eq("user_id", userId);

    if (membershipError) {
      throw new AppError("Failed to fetch classrooms", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: membershipError.code,
      });
    }

    if (memberships.length === 0) {
      return [];
    }

    const classroomIds = memberships.map((row) => row.classroom_id);

    const { data: classrooms, error: classroomError } = await this.db
      .from("classrooms")
      .select("id, name, organization_id, created_by, created_at")
      .in("id", classroomIds);

    if (classroomError) {
      throw new AppError("Failed to fetch classrooms", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: classroomError.code,
      });
    }

    const { data: allMembers, error: memberCountError } = await this.db
      .from("classroom_members")
      .select("classroom_id")
      .in("classroom_id", classroomIds);

    if (memberCountError) {
      throw new AppError("Failed to fetch classrooms", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: memberCountError.code,
      });
    }

    const { data: allProblems, error: problemCountError } = await this.db
      .from("classroom_problems")
      .select("classroom_id")
      .in("classroom_id", classroomIds);

    if (problemCountError) {
      throw new AppError("Failed to fetch classrooms", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: problemCountError.code,
      });
    }

    const roleByClassroomId = new Map(memberships.map((row) => [row.classroom_id, row.role]));
    const studentCountByClassroomId = new Map<string, number>();
    const problemCountByClassroomId = new Map<string, number>();

    for (const row of allMembers) {
      studentCountByClassroomId.set(
        row.classroom_id,
        (studentCountByClassroomId.get(row.classroom_id) ?? 0) + 1,
      );
    }

    for (const row of allProblems) {
      problemCountByClassroomId.set(
        row.classroom_id,
        (problemCountByClassroomId.get(row.classroom_id) ?? 0) + 1,
      );
    }

    return classrooms.map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      code: classroom.id.slice(0, 8).toUpperCase(),
      role: roleByClassroomId.get(classroom.id) ?? "student",
      studentsCount: studentCountByClassroomId.get(classroom.id) ?? 0,
      problemsCount: problemCountByClassroomId.get(classroom.id) ?? 0,
    }));
  }

  async createClassroom(input: CreateClassroomInput, actor: { userId: string; role: UserRole }) {
    if (actor.role !== "instructor" && actor.role !== "admin") {
      throw new AppError("Only instructors can create classrooms", 403, "FORBIDDEN");
    }

    const { data, error } = await this.db
      .from("classrooms")
      .insert({
        organization_id: input.organizationId,
        name: input.name,
        created_by: actor.userId,
      })
      .select("id, name, organization_id, created_by, created_at")
      .single();

    if (error || !data) {
      throw new AppError("Failed to create classroom", 500, "CLASSROOM_CREATE_FAILED", {
        postgresCode: error?.code,
      });
    }

    const { error: memberError } = await this.db.from("classroom_members").insert({
      classroom_id: data.id,
      user_id: actor.userId,
      role: "instructor",
    });

    if (memberError) {
      throw new AppError(
        "Failed to add creator to classroom",
        500,
        "CLASSROOM_MEMBER_CREATE_FAILED",
        { postgresCode: memberError.code },
      );
    }

    return data;
  }

  async addMember(classroomId: string, input: AddClassroomMemberInput, actor: { userId: string }) {
    await this.ensureInstructorAccess(classroomId, actor.userId);

    const { error } = await this.db.from("classroom_members").insert({
      classroom_id: classroomId,
      user_id: input.userId,
      role: input.role,
    });

    if (error) {
      if (error.code === "23505") {
        throw new AppError("User already in classroom", 409, "CLASSROOM_MEMBER_EXISTS");
      }
      throw new AppError("Failed to add member", 500, "CLASSROOM_MEMBER_ADD_FAILED", {
        postgresCode: error.code,
      });
    }

    return { classroomId, userId: input.userId, role: input.role };
  }

  async removeMember(classroomId: string, memberUserId: string, actor: { userId: string }) {
    await this.ensureInstructorAccess(classroomId, actor.userId);

    const { data, error } = await this.db
      .from("classroom_members")
      .delete()
      .eq("classroom_id", classroomId)
      .eq("user_id", memberUserId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to remove member", 500, "CLASSROOM_MEMBER_REMOVE_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!data) {
      throw new AppError("Classroom member does not exist", 404, "CLASSROOM_MEMBER_NOT_FOUND");
    }

    return { removed: true };
  }

  async assignProblem(classroomId: string, input: AssignProblemInput, actor: { userId: string }) {
    await this.ensureInstructorAccess(classroomId, actor.userId);

    const { data: problemLanguages, error: languageError } = await this.db
      .from("problem_languages")
      .select("language")
      .eq("problem_id", input.problemId);

    if (languageError) {
      throw new AppError("Failed to load problem languages", 500, "PROBLEM_LANGUAGE_FETCH_FAILED", {
        postgresCode: languageError.code,
      });
    }

    const allowed = new Set(problemLanguages.map((row) => row.language));
    const invalid = input.languages.filter((language) => !allowed.has(language));

    if (invalid.length > 0) {
      throw new AppError(
        "Classroom language restriction must be subset of problem languages",
        400,
        "INVALID_CLASSROOM_PROBLEM_LANGUAGES",
        { invalid },
      );
    }

    const { data: assignment, error: assignmentError } = await this.db
      .from("classroom_problems")
      .insert({
        classroom_id: classroomId,
        problem_id: input.problemId,
      })
      .select("id")
      .single();

    if (assignmentError || !assignment) {
      if (assignmentError?.code === "23505") {
        throw new AppError("Problem already assigned to classroom", 409, "CLASSROOM_PROBLEM_EXISTS");
      }
      throw new AppError("Failed to assign problem", 500, "CLASSROOM_PROBLEM_ASSIGN_FAILED", {
        postgresCode: assignmentError?.code,
      });
    }

    const languageRows = input.languages.map((language) => ({
      classroom_problem_id: assignment.id,
      language,
    }));

    const { error: classroomLanguageError } = await this.db
      .from("classroom_problem_languages")
      .insert(languageRows);

    if (classroomLanguageError) {
      await this.db.from("classroom_problems").delete().eq("id", assignment.id);
      throw new AppError("Failed to assign problem languages", 500, "CLASSROOM_PROBLEM_ASSIGN_FAILED", {
        postgresCode: classroomLanguageError.code,
      });
    }

    return {
      classroomProblemId: assignment.id,
      classroomId,
      problemId: input.problemId,
      languages: input.languages,
    };
  }

  async ensureInstructorAccess(classroomId: string, userId: string) {
    const { data, error } = await this.db
      .from("classroom_members")
      .select("role")
      .eq("classroom_id", classroomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to validate classroom access", 500, "CLASSROOM_ACCESS_CHECK_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!data || data.role !== "instructor") {
      throw new AppError("Instructor role required", 403, "FORBIDDEN");
    }
  }

  async ensureClassroomMembership(classroomId: string, userId: string) {
    const { data, error } = await this.db
      .from("classroom_members")
      .select("id")
      .eq("classroom_id", classroomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to validate classroom membership", 500, "CLASSROOM_MEMBERSHIP_CHECK_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!data) {
      throw new AppError("User is not a classroom member", 403, "CLASSROOM_MEMBERSHIP_REQUIRED");
    }
  }

  private async getProblemsWithLanguage(problemIds: string[]) {
    const { data: problems, error: problemsError } = await this.db
      .from("problems")
      .select("id, title, difficulty")
      .in("id", problemIds);

    if (problemsError) {
      throw new AppError("Failed to fetch classroom problems", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: problemsError.code,
      });
    }

    const { data: languages, error: languagesError } = await this.db
      .from("problem_languages")
      .select("problem_id, language")
      .in("problem_id", problemIds);

    if (languagesError) {
      throw new AppError("Failed to fetch classroom problems", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: languagesError.code,
      });
    }

    const languageMap = new Map<string, "c" | "java" | "python">();
    for (const row of languages) {
      if (!languageMap.has(row.problem_id)) {
        languageMap.set(row.problem_id, row.language);
      }
    }

    return problems.map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      prompt: "Open this problem to view full description.",
      language: languageMap.get(problem.id) ?? "python",
    }));
  }

  private async getStudents(userIds: string[]) {
    const { data: users, error } = await this.db
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    if (error) {
      throw new AppError("Failed to fetch classroom members", 500, "CLASSROOM_FETCH_FAILED", {
        postgresCode: error.code,
      });
    }

    return users.map((user) => ({
      id: user.id,
      name: user.full_name,
      email: user.email,
      status: "active" as const,
    }));
  }
}

export const classroomService = new ClassroomService();
