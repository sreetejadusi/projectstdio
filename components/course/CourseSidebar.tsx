import type { CourseDocument, CourseTopicProgressEntry } from "@/lib/types";

type Props = {
  title: string;
  document: CourseDocument;
  selectedModuleIndex: number;
  selectedTopicIndex: number;
  topicProgress: CourseTopicProgressEntry[];
  onSelectTopic: (moduleIndex: number, topicIndex: number) => void;
};

export function CourseSidebar({
  title,
  document,
  selectedModuleIndex,
  selectedTopicIndex,
  topicProgress,
  onSelectTopic,
}: Props) {
  const progressSet = new Set(
    topicProgress.filter((item) => item.completed).map((item) => `${item.moduleId}:${item.topicId}`),
  );

  return (
    <aside className="app-scrollbar rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#fffdf8,#fff7eb)] p-4 shadow-[0_16px_36px_rgba(105,83,55,0.06)]">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Course</p>
      <h1 className="mt-2 text-xl font-semibold">{title}</h1>
      <div className="mt-5 space-y-4">
        {document.modules.map((courseModule, moduleIndex) => (
          <section key={courseModule.id} className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-3">
            <h2 className="text-sm font-semibold">{courseModule.title}</h2>
            <div className="mt-2 space-y-1">
              {courseModule.topics.map((topic, topicIndex) => {
                const selected = selectedModuleIndex === moduleIndex && selectedTopicIndex === topicIndex;
                const completed = progressSet.has(`${courseModule.id}:${topic.id}`);

                return (
                  <button
                    key={topic.id}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "bg-[#fff2d8] text-[color:var(--primary-hover)]"
                        : "text-[color:var(--text-secondary)] hover:bg-[#fff7eb] hover:text-[color:var(--text-primary)]"
                    }`}
                    onClick={() => onSelectTopic(moduleIndex, topicIndex)}
                  >
                    <span>{topic.title}</span>
                    <span className={completed ? "text-emerald-300" : "text-[color:var(--text-secondary)]"}>
                      {completed ? "Done" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
