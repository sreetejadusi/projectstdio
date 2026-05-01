"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import "./styles.css";

type Phase = "intro" | "loading" | "survey" | "success";
type QuestionType =
  | "text"
  | "email"
  | "number"
  | "radio"
  | "checkbox"
  | "textarea"
  | "range";

type Question = {
  id: string;
  number: number;
  question: string;
  type: QuestionType;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
};

const COOKIE_KEY = "frogmatrix_survey_progress";
async function submitUserDiscovery(data: {
  name: string;
  email: string;
  response: string;
}) {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((json as { error?: string })?.error || "Request failed");
  }

  return json;
}

const questions: Question[] = [
  {
    id: "name",
    number: 1,
    question: "What should we call you?",
    type: "text",
    placeholder: "Enter your name",
  },

  {
    id: "age",
    number: 2,
    question: "Age",
    type: "number",
    placeholder: "Enter your age",
  },

  {
    id: "email",
    number: 3,
    question: "Email",
    type: "email",
    placeholder: "Enter your email",
  },

  {
    id: "role",
    number: 4,
    question: "What best describes you?",
    type: "radio",
    options: [
      "School student",
      "College student (non-CS)",
      "CS/IT student",
      "Working professional",
      "Other",
    ],
  },

  {
    id: "level",
    number: 5,
    question: "Your current level in programming?",
    type: "radio",
    options: ["Beginner", "Intermediate", "Advanced"],
  },

  {
    id: "learnSources",
    number: 6,
    question: "Where do you mostly learn from?",
    type: "checkbox",
    options: [
      "YouTube",
      "Coding platforms (LeetCode, GFG, etc.)",
      "College",
      "Books",
      "Friends/mentors",
    ],
  },

  {
    id: "consistency",
    number: 7,
    question: "How often do you learn?",
    type: "radio",
    options: ["Rarely", "A few times a week", "Almost daily", "Daily"],
  },

  {
    id: "lastStruggle",
    number: 8,
    question: "Last time you struggled with a concept — what happened?",
    type: "textarea",
    placeholder: "What topic? What confused you?",
  },

  {
    id: "whereStuck",
    number: 9,
    question: "Where do you usually get stuck?",
    type: "radio",
    options: [
      "Understanding concepts",
      "Solving problems",
      "Remembering things",
      "Debugging",
      "Staying consistent",
    ],
  },

  {
    id: "resourceSwitch",
    number: 10,
    question: "Do you switch between multiple resources for one topic?",
    type: "radio",
    options: ["Rarely", "Sometimes", "Very often", "Always"],
  },

  {
    id: "biggestPain",
    number: 11,
    question: "What slows down your learning the most?",
    type: "textarea",
    placeholder: "Be real — what actually frustrates you?",
  },

  {
    id: "likelyUse",
    number: 12,
    question: "If something fixed these pain points of learning, how likely would you use it?",
    type: "range",
    min: 1,
    max: 5,
  },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [visible, setVisible] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submittedJson, setSubmittedJson] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const current = questions[questionIndex];
  const progress = useMemo(
    () => Math.round(((questionIndex + 1) / questions.length) * 100),
    [questionIndex],
  );

  useEffect(() => {
    try {
      const raw = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${COOKIE_KEY}=`))
        ?.split("=")[1];

      if (!raw) return;

      const parsed = JSON.parse(decodeURIComponent(raw)) as {
        phase?: Phase;
        questionIndex?: number;
        answers?: Record<string, string | string[]>;
      };

      if (parsed.answers && typeof parsed.answers === "object") {
        setAnswers(parsed.answers);
      }

      if (
        typeof parsed.questionIndex === "number" &&
        parsed.questionIndex >= 0 &&
        parsed.questionIndex < questions.length
      ) {
        setQuestionIndex(parsed.questionIndex);
      }

      if (parsed.phase === "survey") {
        setPhase("survey");
      }
    } catch {
      // Ignore malformed cookie values.
    }
  }, []);

  useEffect(() => {
    const payload = encodeURIComponent(
      JSON.stringify({
        phase: phase === "survey" ? "survey" : "intro",
        questionIndex,
        answers,
      }),
    );

    document.cookie = `${COOKIE_KEY}=${payload}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }, [answers, phase, questionIndex]);

  const transitionTo = (next: () => void, delay = 220) => {
    setVisible(false);
    setTimeout(() => {
      next();
      setVisible(true);
    }, delay);
  };

  const startSurvey = () => {
    setShowValidation(false);
    transitionTo(() => setPhase("loading"));
    setTimeout(() => transitionTo(() => setPhase("survey")), 1800);
  };

  const setSingle = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const toggleMulti = (id: string, value: string) => {
    setAnswers((prev) => {
      const existing = (prev[id] as string[]) || [];
      const found = existing.includes(value);
      return {
        ...prev,
        [id]: found
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
  };

  const getValue = (id: string) => answers[id] ?? "";

  const isAnswered = (question: Question) => {
    const value = answers[question.id];
    if (question.type === "checkbox") {
      return Array.isArray(value) && value.length > 0;
    }
    return typeof value === "string" && value.trim().length > 0;
  };

  const isCurrentAnswered = isAnswered(current);
  const allQuestionsAnswered = questions.every((q) => isAnswered(q));

  const nextQuestion = () => {
    if (!isCurrentAnswered) {
      setShowValidation(true);
      return;
    }

    setShowValidation(false);
    if (questionIndex < questions.length - 1) {
      transitionTo(() => setQuestionIndex((prev) => prev + 1));
    }
  };

  const previousQuestion = () => {
    setShowValidation(false);
    if (questionIndex > 0) {
      transitionTo(() => setQuestionIndex((prev) => prev - 1));
    }
  };

  const submit = async () => {
    if (!allQuestionsAnswered) {
      const firstMissingIndex = questions.findIndex((q) => !isAnswered(q));
      if (firstMissingIndex !== -1 && firstMissingIndex !== questionIndex) {
        transitionTo(() => setQuestionIndex(firstMissingIndex));
      }
      setShowValidation(true);
      return;
    }

    setShowValidation(false);
    setSubmitError("");
    setIsSubmitting(true);

    const responsePayload = questions.map((q) => ({
      question_id: q.id,
      question_name: q.question,
      question_answer: answers[q.id] ?? (q.type === "checkbox" ? [] : ""),
    }));

    try {
      await submitUserDiscovery({
        name: String(answers.name ?? ""),
        email: String(answers.email ?? ""),
        response: JSON.stringify(responsePayload),
      });

      const json = JSON.stringify(responsePayload, null, 2);
      setSubmittedJson(json);
      setPhase("success");
      setQuestionIndex(0);
      setAnswers({});
      document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
    } catch (error) {
      const fallback =
        "Something went wrong while saving your response. Please try again.";
      setSubmitError(error instanceof Error ? error.message : fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#d6e5db] text-[#777777]">
      <div className="mx-auto flex min-h-screen w-full max-w-360 flex-col px-5 pb-6 pt-6 sm:px-8 lg:px-10">
        {phase === "survey" && (
          <header className="mb-14 flex items-start justify-between gap-4">
            <Image
              src="/logo.svg"
              alt="FrogMatrix"
              width={120}
              height={38}
              priority
            />
            <p className="text-lg font-medium text-[#787878] max-md:text-base">
              User Discovery Survey
            </p>
          </header>
        )}

        {phase === "survey" && (
          <div className="mb-8">
            <p className="mb-2 text-base font-medium text-[#767676] md:text-lg">
              {questionIndex + 1}/{questions.length} • {progress}% Completed
            </p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#b9b9b9]">
              <div
                className="h-full rounded-full bg-[#28bf5f] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <section
          className={`flex-1 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"} ${phase !== "survey" ? "flex items-center justify-center" : ""}`}
        >
          {phase === "intro" && (
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
              <Image
                src="/logo.svg"
                alt="FrogMatrix"
                width={166}
                height={36}
                priority
                className="mb-12"
              />
              <p className="max-w-4xl text-[19px] leading-normal text-[#777777] max-lg:text-[18px] max-md:text-[16px]">
                we are trying to build a platform different from the existing
                ones, to ease the learning of concepts in computer science. this
                survey helps us to understand more about the problems faced by
                learners like you, so we can build the perfect solution for you.
              </p>
              <button
                type="button"
                onClick={startSurvey}
                className="mt-10 w-full max-w-140 rounded-2xl border border-[#006d2a] bg-[#28bf5f] px-6 py-2.5 text-[22px] font-medium text-[#e9ffe8] shadow-[0_4px_0_0_#006d2a] transition hover:translate-y-px hover:shadow-[0_3px_0_0_#006d2a] max-md:text-[18px]"
              >
                Take Survey
              </button>
            </div>
          )}

          {phase === "loading" && (
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
              <Image
                src="/logo.svg"
                alt="FrogMatrix"
                width={166}
                height={36}
                priority
                className="mb-12"
              />
              <p className="text-center text-[18px] leading-normal text-[#777777] max-md:text-[16px]">
                Loading Survey. Please try not to use AI for sharing your
                opinion.
              </p>
            </div>
          )}

          {phase === "success" && (
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
              <Image
                src="/logo.svg"
                alt="FrogMatrix"
                width={166}
                height={36}
                priority
                className="mb-12"
              />
              <p className="max-w-4xl text-[19px] leading-normal text-[#777777] max-lg:text-[18px] max-md:text-[16px]">
                thank you for taking time to participate. your response has been
                recorded successfully.
              </p>
            </div>
          )}

          {phase === "survey" && (
            <div className="flex h-full flex-col">
              <h1 className="mb-5 text-[40px] font-medium leading-[1.1] text-[#003f1d] max-lg:text-[34px] max-md:text-[28px]">
                {current.number}. {current.question}
              </h1>

              <div className="w-full">
                {(current.type === "text" ||
                  current.type === "email" ||
                  current.type === "number") && (
                  <input
                    type={current.type}
                    value={String(getValue(current.id) || "")}
                    placeholder={current.placeholder ?? "enter your name"}
                    onChange={(e) => setSingle(current.id, e.target.value)}
                    className="survey-input"
                  />
                )}

                {current.type === "textarea" && (
                  <textarea
                    value={String(getValue(current.id) || "")}
                    placeholder={current.placeholder ?? "Type your response"}
                    onChange={(e) => setSingle(current.id, e.target.value)}
                    className="survey-textarea"
                  />
                )}

                {(current.type === "radio" || current.type === "checkbox") && (
                  <div className="grid gap-2.5">
                    {current.options?.map((option) => {
                      const checked =
                        current.type === "radio"
                          ? getValue(current.id) === option
                          : ((getValue(current.id) as string[]) || []).includes(
                              option,
                            );

                      return (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-5 py-3 text-[20px] leading-tight transition max-md:text-[17px] ${
                            checked
                              ? "border-[#1f8d53] bg-[#d2efdc] text-[#1a5f3b]"
                              : "border-[#95a99c] bg-transparent text-[#767676] hover:border-[#3f8f61]"
                          }`}
                        >
                          <input
                            type={current.type}
                            name={current.id}
                            checked={checked}
                            onChange={() =>
                              current.type === "radio"
                                ? setSingle(current.id, option)
                                : toggleMulti(current.id, option)
                            }
                            className="h-4 w-4 accent-[#21bd5d]"
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {current.type === "range" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const selected =
                          String(getValue(current.id) || "") === String(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSingle(current.id, String(value))}
                            className={`h-12 w-14 rounded-xl border text-lg font-medium transition ${
                              selected
                                ? "border-[#1f8d53] bg-[#28bf5f] text-white"
                                : "border-[#95a99c] bg-transparent text-[#6f6f6f] hover:border-[#3f8f61]"
                            }`}
                            aria-label={`Select ${value}`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-base text-[#767676]">
                      Selected: {String(getValue(current.id) || "-")}
                    </p>
                  </div>
                )}

                {showValidation && !isCurrentAnswered && (
                  <p className="mt-2 text-sm text-[#b42318]">
                    This question is required.
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={previousQuestion}
                  disabled={questionIndex === 0}
                  className="rounded-xl border border-[#6f887a] px-4 py-2 text-sm text-[#4f665a] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {questionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    disabled={!isCurrentAnswered}
                    className="min-w-42.5 rounded-2xl border border-[#006d2a] bg-[#28bf5f] px-6 py-2.5 text-[20px] font-medium text-[#edffef] shadow-[0_4px_0_0_#006d2a] transition hover:translate-y-px hover:shadow-[0_3px_0_0_#006d2a] disabled:cursor-not-allowed disabled:opacity-50 max-md:min-w-35 max-md:text-[17px]"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!allQuestionsAnswered || isSubmitting}
                    className="min-w-42.5 rounded-2xl border border-[#006d2a] bg-[#28bf5f] px-6 py-2.5 text-[20px] font-medium text-[#edffef] shadow-[0_4px_0_0_#006d2a] transition hover:translate-y-px hover:shadow-[0_3px_0_0_#006d2a] disabled:cursor-not-allowed disabled:opacity-50 max-md:min-w-35 max-md:text-[17px]"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>

              {submitError && (
                <p className="mt-2 text-sm text-[#b42318]">{submitError}</p>
              )}

              {submittedJson && (
                <div className="mt-7 rounded-xl border border-[#8ea497] bg-[#e4efe7] p-3">
                  <p className="mb-2 text-sm text-[#5f786a]">Submitted JSON</p>
                  <pre className="max-h-64 overflow-auto text-xs text-[#496154]">
                    {submittedJson}
                  </pre>
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="mt-8 flex flex-col gap-2 text-[14px] text-[#7d7d7d] sm:flex-row sm:items-end sm:justify-between max-md:text-[12px]">
          <p>© 2026 FrogMatrix. All Rights Reserved.</p>
          <p className="sm:text-right">
            we do not sell your emails or personal information.
          </p>
        </footer>
      </div>
    </main>
  );
}
