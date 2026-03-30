"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import type {
  Classroom,
  ClassroomDetail,
  ClassroomRole,
  ProblemDifficulty,
  ProblemLanguage,
} from "@/lib/types";
import { ClassroomStrip } from "@/components/workspace/ClassroomStrip";
import { OpenProblemsFeed } from "@/components/workspace/OpenProblemsFeed";

export type WorkspaceFocus = "classrooms" | "problems";

export type OpenProblemCard = {
  id: string;
  title: string;
  difficulty: ProblemDifficulty;
  language: ProblemLanguage;
  classrooms: Array<{
    id: string;
    name: string;
    role: ClassroomRole;
  }>;
};

function buildOpenProblems(classroomDetails: ClassroomDetail[]) {
  const problemMap = new Map<string, OpenProblemCard>();

  for (const classroom of classroomDetails) {
    for (const problem of classroom.problems) {
      const existing = problemMap.get(problem.id);
      const classroomEntry = {
        id: classroom.id,
        name: classroom.name,
        role: classroom.role,
      };

      if (existing) {
        existing.classrooms.push(classroomEntry);
        continue;
      }

      problemMap.set(problem.id, {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        language: problem.language,
        classrooms: [classroomEntry],
      });
    }
  }

  return [...problemMap.values()].sort((left, right) =>
    left.title.localeCompare(right.title),
  );
}

export function WorkspaceHub({ focus = "classrooms" }: { focus?: WorkspaceFocus }) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomDetails, setClassroomDetails] = useState<ClassroomDetail[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      setLoading(true);
      setError(null);

      try {
        const rooms = await api.getClassrooms();
        setClassrooms(rooms);

        const details = await Promise.all(
          rooms.map(async (room) => api.getClassroom(room.id)),
        );

        setClassroomDetails(details);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load workspace",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadWorkspace();
  }, []);

  const openProblems = useMemo(
    () => buildOpenProblems(classroomDetails),
    [classroomDetails],
  );

  const visibleProblems = useMemo(() => {
    if (!selectedClassroomId) {
      return openProblems;
    }

    return openProblems.filter((problem) =>
      problem.classrooms.some((classroom) => classroom.id === selectedClassroomId),
    );
  }, [openProblems, selectedClassroomId]);

  const selectedClassroomName = useMemo(() => {
    if (!selectedClassroomId) {
      return null;
    }

    return classrooms.find((classroom) => classroom.id === selectedClassroomId)?.name ?? null;
  }, [classrooms, selectedClassroomId]);

  return (
    <AppShell hideFooter>
      <div className="space-y-6">
        <ClassroomStrip
          classrooms={classrooms}
          focus={focus}
          loading={loading}
          selectedClassroomId={selectedClassroomId}
          onSelectClassroom={setSelectedClassroomId}
        />

        <OpenProblemsFeed
          focus={focus}
          loading={loading}
          error={error}
          problems={visibleProblems}
          selectedClassroomId={selectedClassroomId}
          selectedClassroomName={selectedClassroomName}
        />
      </div>
    </AppShell>
  );
}
