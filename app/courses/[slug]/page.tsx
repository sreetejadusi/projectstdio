"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { MarkdownRenderer } from "@/components/course/MarkdownRenderer";
import { ResourceViewer } from "@/components/course/ResourceViewer";
import { CodelabSection } from "@/components/course/CodelabSection";
import { api } from "@/lib/api";
import type { CourseDetail } from "@/lib/types";

function getSafeTopicSelection(course: CourseDetail | null, moduleIndex: number, topicIndex: number) {
  const modules = course?.course.document.modules ?? [];
  if (modules.length === 0) {
    return { moduleIndex: 0, topicIndex: 0 };
  }

  const nextModuleIndex = Math.min(Math.max(moduleIndex, 0), modules.length - 1);
  const topics = modules[nextModuleIndex]?.topics ?? [];
  const nextTopicIndex = topics.length === 0 ? 0 : Math.min(Math.max(topicIndex, 0), topics.length - 1);

  return {
    moduleIndex: nextModuleIndex,
    topicIndex: nextTopicIndex,
  };
}

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const lastOpenedTopicKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await api.getCourse(slug);
        if (active) {
          setCourseDetail(result);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load course");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      void load();
    }

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const selection = getSafeTopicSelection(courseDetail, selectedModuleIndex, selectedTopicIndex);
    if (selection.moduleIndex !== selectedModuleIndex) {
      setSelectedModuleIndex(selection.moduleIndex);
    }
    if (selection.topicIndex !== selectedTopicIndex) {
      setSelectedTopicIndex(selection.topicIndex);
    }
  }, [courseDetail, selectedModuleIndex, selectedTopicIndex]);

  useEffect(() => {
    const modules = courseDetail?.course.document.modules ?? [];
    const selectedModule = modules[selectedModuleIndex];
    const topic = selectedModule?.topics[selectedTopicIndex];
    const topicKey = selectedModule && topic ? `${selectedModule.id}:${topic.id}` : null;

    if (!slug || !selectedModule || !topic || topicKey == null || lastOpenedTopicKeyRef.current === topicKey) {
      return;
    }

    lastOpenedTopicKeyRef.current = topicKey;

    void api
      .updateCourseTopicProgress(slug, {
        moduleId: selectedModule.id,
        topicId: topic.id,
      })
      .then((updated) => {
        setCourseDetail(updated);
      })
      .catch(() => {
        // Keep topic navigation responsive even if progress tracking fails.
      });
  }, [courseDetail, selectedModuleIndex, selectedTopicIndex, slug]);

  const modules = courseDetail?.course.document.modules ?? [];
  const selectedModule = modules[selectedModuleIndex];
  const topic = selectedModule?.topics[selectedTopicIndex];
  const isEmpty = !loading && (!courseDetail || modules.length === 0 || !selectedModule || selectedModule.topics.length === 0 || !topic);

  const handleComplete = async () => {
    if (!slug || !selectedModule || !topic) {
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateCourseTopicProgress(slug, {
        moduleId: selectedModule.id,
        topicId: topic.id,
        completed: true,
      });
      setCourseDetail(updated);
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : "Failed to update course progress");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(135deg,#fff8eb,#fff4ec_42%,#fffaf3)] p-6 shadow-[0_18px_42px_rgba(105,83,55,0.08)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Course Viewer</p>
          <h1 className="mt-2 text-4xl font-semibold">{courseDetail?.course.title ?? "Loading course"}</h1>
          <p className="mt-3 max-w-3xl text-base text-[color:var(--text-secondary)]">{courseDetail?.course.description ?? "Course content is loaded from Supabase Storage."}</p>
          {courseDetail ? (
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-[color:var(--text-secondary)]">
              <span className="rounded-full bg-white/80 px-4 py-2">{courseDetail.course.moduleCount} modules</span>
              <span className="rounded-full bg-white/80 px-4 py-2">{courseDetail.course.topicCount} topics</span>
              <span className="rounded-full bg-white/80 px-4 py-2">Progress {courseDetail.course.progressPercent}%</span>
            </div>
          ) : null}
        </header>

        {error ? (
          <Card title="Course error">
            <p className="text-sm text-red-300">{error}</p>
          </Card>
        ) : null}

        {loading ? <p className="text-sm text-[color:var(--text-secondary)]">Loading course content...</p> : null}

        {courseDetail && !isEmpty ? (
          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <CourseSidebar
              title={courseDetail.course.title}
              document={courseDetail.course.document}
              selectedModuleIndex={selectedModuleIndex}
              selectedTopicIndex={selectedTopicIndex}
              topicProgress={courseDetail.topicProgress}
              onSelectTopic={(moduleIndex, topicIndex) => {
                setSelectedModuleIndex(moduleIndex);
                setSelectedTopicIndex(topicIndex);
              }}
            />

            <div className="space-y-4">
              <Card title={selectedModule.title} className="bg-[linear-gradient(180deg,#fffdfa,#fff8ef)]">
                <div className="space-y-4">
                  <MarkdownRenderer content={selectedModule.description} />
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">Topic</p>
                      <h2 className="mt-1 text-2xl font-semibold">{topic.title}</h2>
                      <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Move one topic at a time. Keep the course feeling light.</p>
                    </div>
                    <Button onClick={handleComplete} disabled={saving}>
                      {saving ? "Saving..." : "Mark Complete"}
                    </Button>
                  </div>
                  <MarkdownRenderer content={topic.content} />
                </div>
              </Card>

              {topic.url ? <ResourceViewer url={topic.url} /> : null}
              {selectedModule.codelab ? <CodelabSection problemId={selectedModule.codelab} /> : null}
            </div>
          </div>
        ) : null}

        {isEmpty ? (
          <Card title="Empty course">
            <p className="text-sm text-[color:var(--text-secondary)]">This course does not contain any modules or topics yet.</p>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
