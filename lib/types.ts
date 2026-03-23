export type UserRole = "student" | "instructor" | "admin";
export type ClassroomRole = "student" | "instructor";
export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemLanguage = "c" | "java" | "python";
export type CourseLanguage = ProblemLanguage;
export type CourseDifficulty = "beginner" | "intermediate" | "advanced";

export type RequestContext = {
  requestId: string;
  userId?: string;
  userRole?: UserRole;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  organizationId?: string;
  sessionId: string;
  iat: number;
  exp: number;
};

export type Classroom = {
  id: string;
  name: string;
  code: string;
  role: "instructor" | "student";
  studentsCount: number;
  problemsCount: number;
};

export type Problem = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  language: ProblemLanguage;
};

export type ProblemMetadata = {
  id: string;
  title: string;
  difficulty: ProblemDifficulty;
  createdAt?: string;
  metadata?: unknown;
  languages?: ProblemLanguage[];
};

export type ProblemTestCase = {
  id: string;
  input: string;
  expectedOutput: string;
  visibility: "visible" | "hidden";
};

export type ProblemSolveData = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  descriptionMarkdown: string;
  constraints: string;
  testcases: ProblemTestCase[];
  languages: ProblemLanguage[];
  selectedLanguage: ProblemLanguage;
  runtime: {
    templateVersion: number;
    language: ProblemLanguage;
    entryFile: string;
    timeLimitMs: number;
    memoryLimitMb: number;
    cpuCores: number;
    allowNetwork: boolean;
  };
  baseCode: string;
  flowchart: FlowchartData | null;
};

export type ClassroomDetail = {
  id: string;
  name: string;
  role: "instructor" | "student";
  problems: Problem[];
  students: Array<{
    id: string;
    name: string;
    email: string;
    status: "active" | "invited";
  }>;
};

export type CourseTopic = {
  id: string;
  title: string;
  content: string;
  url: string | null;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string;
  codelab: string | null;
  topics: CourseTopic[];
};

export type CourseDocument = {
  template: "v1";
  version: number;
  id: string;
  title: string;
  description: string;
  language: CourseLanguage;
  difficulty: CourseDifficulty;
  modules: CourseModule[];
};

export type CourseCatalogItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  language: CourseLanguage | null;
  difficulty: CourseDifficulty | null;
  thumbnailUrl: string | null;
  estimatedHours: number | null;
  isPublished: boolean;
  topicCount: number;
  moduleCount: number;
  progressPercent: number;
  lastAccessedAt: string | null;
};

export type CourseTopicProgressEntry = {
  moduleId: string;
  topicId: string;
  completed: boolean;
  completedAt: string | null;
  lastViewedAt: string | null;
};

export type CourseEnrollment = {
  progressPercent: number;
  startedAt: string | null;
  lastAccessedAt: string | null;
  completedAt: string | null;
};

export type CourseDetail = {
  course: CourseCatalogItem & {
    storagePath: string;
    document: CourseDocument;
  };
  enrollment: CourseEnrollment | null;
  topicProgress: CourseTopicProgressEntry[];
};

export type FlowchartData = {
  nodes: Array<{
    id: string;
    label: string;
    status: "neutral" | "matched";
    x: number;
    y: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
};

export type VisualizationStackFrame = {
  func_name: string;
  line: number | null;
  locals: Record<string, unknown>;
};

export type VisualizationStep = {
  event: string;
  line: number | null;
  globals: Record<string, unknown>;
  stack: VisualizationStackFrame[];
  memory: Record<string, unknown>;
  stdout: string;
  exception: string | Record<string, unknown> | null;
  return: unknown;
  locals: Record<string, unknown>;
};

export type VisualizationTrace = {
  steps: VisualizationStep[];
};

export type RunResult = {
  executionId?: string;
  status: "queued" | "running" | "completed" | "failed";
  language?: ProblemLanguage;
  createdAt?: number;
  progress?: {
    type?: "progress";
    current: number;
    total: number;
    output?: string;
  };
  result?: ExecutionVerdict;
  tests: Array<{
    id: string;
    name?: string;
    passed: boolean;
    expectedOutput?: string;
    actualOutput?: string;
  }>;
};

export type ExecuteQueuedResponse = {
  executionId: string;
  status: "queued";
};

export type ExecuteResultResponse = {
  executionId?: string;
  language?: ProblemLanguage;
  status: "queued" | "running" | "completed" | "failed";
  createdAt?: number;
  progress?: {
    type?: "progress";
    current: number;
    total: number;
    output?: string;
  };
  result?: ExecutionVerdict;
};

export type ExecutionVerdict = {
  type?: "final";
  status:
    | "Accepted"
    | "Wrong Answer"
    | "Compilation Error"
    | "Runtime Error"
    | "Time Limit Exceeded";
  passed?: number;
  total?: number;
  failedTestCase?: number;
  error?: string;
  expected?: string;
  got?: string;
};

export type SubmitResult = {
  submissionId: string;
  submissionCodePath: string;
  submissionDataFilePath: string;
  language: ProblemLanguage;
};

export type AuthResponse = {
  sessionId: string;
  user: {
    id: string;
    name: string;
    role: "instructor" | "student";
  };
};

export type TelemetryEvent = {
  type: string;
  ts: number;
  page: string;
  sessionId: string;
  payload?: Record<string, unknown>;
};
