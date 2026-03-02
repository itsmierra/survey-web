# 겨울수련회 설문조사 웹 앱 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 모바일 반응형 설문조사 웹앱 - 응답자가 설문에 답하고, 관리자가 대시보드에서 관리/분석하는 시스템

**Architecture:** Next.js 15 App Router + Supabase (PostgreSQL + Auth + Realtime). 응답자는 이름만 입력하고 설문 응답, 관리자는 Supabase Auth로 로그인. shadcn/ui + Tailwind CSS로 모바일 퍼스트 반응형 UI.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase, Recharts, xlsx, qrcode

**Design Doc:** `docs/plans/2026-03-02-survey-web-design.md`

---

## Phase 1: 프로젝트 초기 설정

### Task 1: Next.js 프로젝트 스캐폴딩

**Files:**
- Create: 프로젝트 루트 전체 (create-next-app이 생성)

**Step 1: Next.js 앱 생성**

```bash
cd /Users/mierra/Documents/Dev/2026/survey_web
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

프롬프트 선택:
- Would you like to use Turbopack? → Yes

**Step 2: 정상 실행 확인**

```bash
npm run dev
```

`http://localhost:3000` 접속하여 Next.js 기본 페이지 확인.

**Step 3: 기본 페이지 정리**

`src/app/page.tsx`의 기본 컨텐츠를 빈 페이지로 교체:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">설문조사</h1>
    </main>
  );
}
```

`src/app/globals.css`에서 Tailwind import 3줄만 남기고 나머지 스타일 삭제.

**Step 4: git 초기화 및 커밋**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 15 project with TypeScript + Tailwind"
```

---

### Task 2: shadcn/ui 설정

**Files:**
- Modify: `components.json` (자동 생성)
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: shadcn/ui 초기화**

```bash
npx shadcn@latest init
```

프롬프트 선택:
- Style: New York
- Base color: Neutral
- CSS variables: Yes

**Step 2: 자주 쓸 기본 컴포넌트 설치**

```bash
npx shadcn@latest add button card input label textarea select dialog badge separator progress tabs table dropdown-menu toast checkbox radio-group form
```

**Step 3: 설치 확인**

`src/components/ui/` 디렉토리에 컴포넌트 파일들이 생성되었는지 확인.

**Step 4: 커밋**

```bash
git add .
git commit -m "chore: add shadcn/ui with core components"
```

---

### Task 3: Supabase 클라이언트 설정

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `.env.local`
- Modify: `package.json` (의존성 추가)

**Step 1: Supabase 패키지 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Step 2: 환경 변수 파일 생성**

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`.env.local`은 사용자가 Supabase 프로젝트 생성 후 직접 입력해야 함.

**Step 3: 브라우저 클라이언트 생성**

`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 4: 서버 클라이언트 생성**

`src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서는 set 불가 - 무시
          }
        },
      },
    }
  );
}
```

**Step 5: 미들웨어 헬퍼 생성**

`src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 관리자 페이지 접근 시 인증 확인 (로그인 페이지 제외)
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

**Step 6: Next.js 미들웨어 생성**

`src/middleware.ts`:
```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 7: 커밋**

```bash
git add src/lib/supabase/ src/middleware.ts .env.local
git commit -m "feat: add Supabase client/server/middleware setup"
```

---

### Task 4: TypeScript 타입 정의

**Files:**
- Create: `src/lib/types.ts`

**Step 1: 데이터 타입 작성**

`src/lib/types.ts`:
```typescript
export type SurveyStatus = "draft" | "active" | "closed";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "text"
  | "rating"
  | "datetime";

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  label: string;
  value: string;
}

export interface QuestionCondition {
  question_id: string;
  operator: "equals" | "not_equals" | "contains";
  value: string | string[];
}

export interface Question {
  id: string;
  survey_id: string;
  type: QuestionType;
  title: string;
  description: string | null;
  options: QuestionOption[] | null;
  required: boolean;
  order_index: number;
  condition: QuestionCondition | null;
  created_at: string;
}

export interface Respondent {
  id: string;
  survey_id: string;
  name: string;
  created_at: string;
}

export interface AnswerValue {
  selected?: string | string[];
  text?: string;
  rating?: number;
  datetime?: string;
}

export interface Answer {
  id: string;
  respondent_id: string;
  question_id: string;
  value: AnswerValue;
  created_at: string;
}

// 설문 + 문항 포함 (응답 페이지용)
export interface SurveyWithQuestions extends Survey {
  questions: Question[];
}

// 응답자 + 답변 포함 (관리자 상세 보기용)
export interface RespondentWithAnswers extends Respondent {
  answers: Answer[];
}
```

**Step 2: 커밋**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript type definitions for survey data model"
```

---

### Task 5: Supabase 데이터베이스 스키마

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: 마이그레이션 SQL 작성**

`supabase/migrations/001_initial_schema.sql`:
```sql
-- 설문 상태 enum
CREATE TYPE survey_status AS ENUM ('draft', 'active', 'closed');

-- 문항 유형 enum
CREATE TYPE question_type AS ENUM (
  'single_choice',
  'multiple_choice',
  'text',
  'rating',
  'datetime'
);

-- surveys 테이블
CREATE TABLE surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status survey_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- questions 테이블
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  type question_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB,
  required BOOLEAN DEFAULT false NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  condition JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- respondents 테이블
CREATE TABLE respondents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(survey_id, name)
);

-- answers 테이블
CREATE TABLE answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  respondent_id UUID REFERENCES respondents(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_respondents_survey_id ON respondents(survey_id);
CREATE INDEX idx_answers_respondent_id ON answers(respondent_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS 정책
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- 공개 읽기: 활성 설문은 누구나 읽기 가능
CREATE POLICY "Active surveys are publicly readable"
  ON surveys FOR SELECT
  USING (status = 'active');

-- 관리자: 모든 설문 CRUD
CREATE POLICY "Admins can do everything with surveys"
  ON surveys FOR ALL
  USING (auth.role() = 'authenticated');

-- 공개 읽기: 활성 설문의 문항
CREATE POLICY "Questions of active surveys are publicly readable"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = questions.survey_id
      AND surveys.status = 'active'
    )
  );

-- 관리자: 모든 문항 CRUD
CREATE POLICY "Admins can do everything with questions"
  ON questions FOR ALL
  USING (auth.role() = 'authenticated');

-- 응답자: 본인 응답 생성
CREATE POLICY "Anyone can create respondents for active surveys"
  ON respondents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = respondents.survey_id
      AND surveys.status = 'active'
    )
  );

-- 관리자: 모든 응답자 읽기
CREATE POLICY "Admins can read all respondents"
  ON respondents FOR SELECT
  USING (auth.role() = 'authenticated');

-- 응답: 누구나 생성 가능
CREATE POLICY "Anyone can create answers"
  ON answers FOR INSERT
  WITH CHECK (true);

-- 관리자: 모든 응답 읽기
CREATE POLICY "Admins can read all answers"
  ON answers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE respondents;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
```

**Step 2: Supabase 대시보드에서 SQL 실행**

사용자가 Supabase 프로젝트의 SQL Editor에서 위 SQL을 직접 실행해야 합니다.

**Step 3: 커밋**

```bash
git add supabase/
git commit -m "feat: add initial database schema with RLS policies"
```

---

## Phase 2: 응답자 화면

### Task 6: 레이아웃 및 메인 페이지

**Files:**
- Create: `src/app/(respondent)/layout.tsx`
- Modify: `src/app/(respondent)/page.tsx` (기존 `src/app/page.tsx`를 이동)
- Modify: `src/app/layout.tsx`

**Step 1: 루트 레이아웃 정리**

`src/app/layout.tsx`는 기본 html/body 구조만 유지. 기존 page.tsx를 삭제하고 route group으로 이동.

```bash
mkdir -p src/app/\(respondent\)
mv src/app/page.tsx src/app/\(respondent\)/page.tsx
```

**Step 2: 응답자 레이아웃 생성**

`src/app/(respondent)/layout.tsx`:
```tsx
export default function RespondentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="text-lg font-semibold text-center">겨울수련회 설문조사</h1>
      </header>
      <main className="max-w-lg mx-auto p-4">{children}</main>
    </div>
  );
}
```

**Step 3: 메인 페이지 - 활성 설문 목록**

`src/app/(respondent)/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        참여할 설문을 선택해주세요
      </p>

      {(!surveys || surveys.length === 0) && (
        <p className="text-center text-muted-foreground py-8">
          현재 진행 중인 설문이 없습니다.
        </p>
      )}

      {surveys?.map((survey) => (
        <Link key={survey.id} href={`/survey/${survey.id}`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{survey.title}</CardTitle>
                <Badge variant="secondary">진행중</Badge>
              </div>
              {survey.description && (
                <CardDescription>{survey.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

**Step 4: 개발 서버에서 확인**

```bash
npm run dev
```

`http://localhost:3000` 접속하여 레이아웃과 빈 설문 목록이 표시되는지 확인.

**Step 5: 커밋**

```bash
git add .
git commit -m "feat: add respondent layout and active surveys listing page"
```

---

### Task 7: 설문 응답 페이지 - 이름 입력 및 문항 폼

**Files:**
- Create: `src/app/(respondent)/survey/[id]/page.tsx`
- Create: `src/components/survey/SurveyForm.tsx`
- Create: `src/components/survey/NameEntryForm.tsx`
- Create: `src/components/survey/QuestionRenderer.tsx`
- Create: `src/components/survey/questions/SingleChoiceQuestion.tsx`
- Create: `src/components/survey/questions/MultipleChoiceQuestion.tsx`
- Create: `src/components/survey/questions/TextQuestion.tsx`
- Create: `src/components/survey/questions/RatingQuestion.tsx`
- Create: `src/components/survey/questions/DateTimeQuestion.tsx`

**Step 1: 설문 페이지 (서버 컴포넌트)**

`src/app/(respondent)/survey/[id]/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/survey/SurveyForm";
import type { SurveyWithQuestions } from "@/lib/types";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!survey) {
    notFound();
  }

  // 문항 순서대로 정렬
  const surveyWithSortedQuestions: SurveyWithQuestions = {
    ...survey,
    questions: survey.questions.sort(
      (a: { order_index: number }, b: { order_index: number }) =>
        a.order_index - b.order_index
    ),
  };

  return <SurveyForm survey={surveyWithSortedQuestions} />;
}
```

**Step 2: 이름 입력 폼**

`src/components/survey/NameEntryForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NameEntryFormProps {
  surveyTitle: string;
  onSubmit: (name: string) => void;
  error: string | null;
}

export function NameEntryForm({ surveyTitle, onSubmit, error }: NameEntryFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{surveyTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름을 입력해주세요</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={!name.trim()}>
            설문 시작하기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 3: 문항 유형별 컴포넌트**

`src/components/survey/questions/SingleChoiceQuestion.tsx`:
```tsx
"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuestionOption } from "@/lib/types";

interface SingleChoiceQuestionProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export function SingleChoiceQuestion({
  options,
  value,
  onChange,
}: SingleChoiceQuestionProps) {
  return (
    <RadioGroup value={value || ""} onValueChange={onChange}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-3 py-2">
          <RadioGroupItem value={option.value} id={option.value} />
          <Label htmlFor={option.value} className="text-base cursor-pointer flex-1">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
```

`src/components/survey/questions/MultipleChoiceQuestion.tsx`:
```tsx
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { QuestionOption } from "@/lib/types";

interface MultipleChoiceQuestionProps {
  options: QuestionOption[];
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

export function MultipleChoiceQuestion({
  options,
  value = [],
  onChange,
}: MultipleChoiceQuestionProps) {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-3 py-2">
          <Checkbox
            id={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
          />
          <Label htmlFor={option.value} className="text-base cursor-pointer flex-1">
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
```

`src/components/survey/questions/TextQuestion.tsx`:
```tsx
"use client";

import { Textarea } from "@/components/ui/textarea";

interface TextQuestionProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function TextQuestion({ value, onChange }: TextQuestionProps) {
  return (
    <Textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="답변을 입력해주세요..."
      rows={3}
      className="text-base"
    />
  );
}
```

`src/components/survey/questions/RatingQuestion.tsx`:
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RatingQuestionProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function RatingQuestion({ value, onChange }: RatingQuestionProps) {
  return (
    <div className="flex gap-2 justify-center py-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <Button
          key={rating}
          type="button"
          variant={value === rating ? "default" : "outline"}
          className={cn(
            "w-12 h-12 text-lg",
            value === rating && "ring-2 ring-offset-2"
          )}
          onClick={() => onChange(rating)}
        >
          {rating}
        </Button>
      ))}
    </div>
  );
}
```

`src/components/survey/questions/DateTimeQuestion.tsx`:
```tsx
"use client";

import { Input } from "@/components/ui/input";

interface DateTimeQuestionProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function DateTimeQuestion({ value, onChange }: DateTimeQuestionProps) {
  return (
    <Input
      type="datetime-local"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="text-base"
    />
  );
}
```

**Step 4: 문항 렌더러 (타입별 분기)**

`src/components/survey/QuestionRenderer.tsx`:
```tsx
"use client";

import type { Question, AnswerValue } from "@/lib/types";
import { SingleChoiceQuestion } from "./questions/SingleChoiceQuestion";
import { MultipleChoiceQuestion } from "./questions/MultipleChoiceQuestion";
import { TextQuestion } from "./questions/TextQuestion";
import { RatingQuestion } from "./questions/RatingQuestion";
import { DateTimeQuestion } from "./questions/DateTimeQuestion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionRendererProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
}: QuestionRendererProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <CardTitle className="text-base flex-1">
            {question.title}
          </CardTitle>
          {question.required && (
            <Badge variant="destructive" className="text-xs shrink-0">
              필수
            </Badge>
          )}
        </div>
        {question.description && (
          <p className="text-sm text-muted-foreground">{question.description}</p>
        )}
      </CardHeader>
      <CardContent>
        {question.type === "single_choice" && question.options && (
          <SingleChoiceQuestion
            options={question.options}
            value={value?.selected as string | undefined}
            onChange={(selected) => onChange({ selected })}
          />
        )}
        {question.type === "multiple_choice" && question.options && (
          <MultipleChoiceQuestion
            options={question.options}
            value={value?.selected as string[] | undefined}
            onChange={(selected) => onChange({ selected })}
          />
        )}
        {question.type === "text" && (
          <TextQuestion
            value={value?.text}
            onChange={(text) => onChange({ text })}
          />
        )}
        {question.type === "rating" && (
          <RatingQuestion
            value={value?.rating}
            onChange={(rating) => onChange({ rating })}
          />
        )}
        {question.type === "datetime" && (
          <DateTimeQuestion
            value={value?.datetime}
            onChange={(datetime) => onChange({ datetime })}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 5: 메인 설문 폼 (상태 관리 + 제출)**

`src/components/survey/SurveyForm.tsx`:
```tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NameEntryForm } from "./NameEntryForm";
import { QuestionRenderer } from "./QuestionRenderer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SurveyWithQuestions, AnswerValue, QuestionCondition } from "@/lib/types";

interface SurveyFormProps {
  survey: SurveyWithQuestions;
}

export function SurveyForm({ survey }: SurveyFormProps) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 조건부 문항 필터링
  const visibleQuestions = useMemo(() => {
    return survey.questions.filter((q) => {
      if (!q.condition) return true;
      const condition = q.condition as QuestionCondition;
      const dependentAnswer = answers[condition.question_id];
      if (!dependentAnswer) return false;

      const selectedValue = dependentAnswer.selected;
      switch (condition.operator) {
        case "equals":
          if (Array.isArray(selectedValue)) {
            return Array.isArray(condition.value)
              ? condition.value.every((v) => selectedValue.includes(v))
              : selectedValue.includes(condition.value);
          }
          return selectedValue === condition.value;
        case "not_equals":
          return selectedValue !== condition.value;
        case "contains":
          if (Array.isArray(selectedValue)) {
            return Array.isArray(condition.value)
              ? condition.value.some((v) => selectedValue.includes(v))
              : selectedValue.includes(condition.value);
          }
          return false;
        default:
          return true;
      }
    });
  }, [survey.questions, answers]);

  // 진행률 계산
  const answeredCount = visibleQuestions.filter(
    (q) => answers[q.id] !== undefined
  ).length;
  const progressPercent =
    visibleQuestions.length > 0
      ? Math.round((answeredCount / visibleQuestions.length) * 100)
      : 0;

  // 필수 문항 검증
  const requiredUnanswered = visibleQuestions.filter(
    (q) => q.required && !answers[q.id]
  );

  const handleNameSubmit = async (inputName: string) => {
    const supabase = createClient();

    // 중복 이름 체크
    const { data: existing } = await supabase
      .from("respondents")
      .select("id")
      .eq("survey_id", survey.id)
      .eq("name", inputName)
      .single();

    if (existing) {
      setNameError("이미 응답한 이름입니다. 다른 이름을 입력해주세요.");
      return;
    }

    setName(inputName);
    setNameError(null);
  };

  const handleSubmit = async () => {
    if (requiredUnanswered.length > 0) {
      setSubmitError(
        `필수 문항 ${requiredUnanswered.length}개에 답변해주세요.`
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();

      // 응답자 등록
      const { data: respondent, error: respondentError } = await supabase
        .from("respondents")
        .insert({ survey_id: survey.id, name: name! })
        .select()
        .single();

      if (respondentError) throw respondentError;

      // 답변 일괄 등록
      const answerRows = Object.entries(answers).map(
        ([question_id, value]) => ({
          respondent_id: respondent.id,
          question_id,
          value,
        })
      );

      if (answerRows.length > 0) {
        const { error: answerError } = await supabase
          .from("answers")
          .insert(answerRows);

        if (answerError) throw answerError;
      }

      router.push(`/survey/${survey.id}/complete`);
    } catch {
      setSubmitError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  // 이름 입력 전
  if (!name) {
    return (
      <NameEntryForm
        surveyTitle={survey.title}
        onSubmit={handleNameSubmit}
        error={nameError}
      />
    );
  }

  // 설문 응답 화면
  return (
    <div className="space-y-4">
      {/* 진행률 */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {answeredCount}/{visibleQuestions.length} 문항
          </span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* 문항 목록 */}
      {visibleQuestions.map((question) => (
        <QuestionRenderer
          key={question.id}
          question={question}
          value={answers[question.id]}
          onChange={(value) =>
            setAnswers((prev) => ({ ...prev, [question.id]: value }))
          }
        />
      ))}

      {/* 제출 */}
      {submitError && (
        <p className="text-sm text-destructive text-center">{submitError}</p>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "제출 중..." : "설문 제출하기"}
      </Button>
    </div>
  );
}
```

**Step 6: 커밋**

```bash
git add .
git commit -m "feat: add survey response page with all question types and conditional logic"
```

---

### Task 8: 설문 완료 페이지

**Files:**
- Create: `src/app/(respondent)/survey/[id]/complete/page.tsx`

**Step 1: 완료 페이지 작성**

`src/app/(respondent)/survey/[id]/complete/page.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompletePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-xl">설문이 제출되었습니다!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            소중한 답변 감사합니다.
          </p>
          <Link href="/">
            <Button variant="outline">메인으로 돌아가기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: 커밋**

```bash
git add .
git commit -m "feat: add survey completion page"
```

---

## Phase 3: 관리자 화면 - 인증 및 기본 구조

### Task 9: 관리자 로그인 페이지

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`

**Step 1: 관리자 레이아웃**

`src/app/admin/layout.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 로그인 페이지는 레이아웃 적용 안함 (미들웨어에서 처리)
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavWrapper />
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}

async function AdminNavWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return <AdminNav userEmail={user.email || ""} />;
}
```

**Step 2: 관리자 네비게이션 컴포넌트**

`src/components/admin/AdminNav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminNavProps {
  userEmail: string;
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const links = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/surveys", label: "설문 관리" },
  ];

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
        <nav className="flex items-center gap-4">
          <Link href="/admin" className="font-semibold text-lg">
            관리자
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm",
                pathname === link.href
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden md:block">
            {userEmail}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
}
```

**Step 3: 로그인 페이지**

`src/app/admin/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">관리자 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: 커밋**

```bash
git add .
git commit -m "feat: add admin login page, layout, and navigation"
```

---

### Task 10: 관리자 대시보드

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/DashboardStats.tsx`
- Create: `src/components/admin/RealtimeResponseCount.tsx`

**Step 1: 대시보드 패키지 설치**

```bash
npm install recharts
```

**Step 2: 대시보드 페이지 (서버 컴포넌트)**

`src/app/admin/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RealtimeResponseCount } from "@/components/admin/RealtimeResponseCount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false });

  // 각 설문별 응답 수
  const surveyStats = await Promise.all(
    (surveys || []).map(async (survey) => {
      const { count } = await supabase
        .from("respondents")
        .select("*", { count: "exact", head: true })
        .eq("survey_id", survey.id);
      return {
        id: survey.id,
        title: survey.title,
        status: survey.status,
        responseCount: count || 0,
      };
    })
  );

  const totalSurveys = surveys?.length || 0;
  const totalResponses = surveyStats.reduce(
    (sum, s) => sum + s.responseCount,
    0
  );
  const activeSurveys = surveys?.filter((s) => s.status === "active").length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              전체 설문
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSurveys}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              진행 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeSurveys}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              총 응답 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeResponseCount initialCount={totalResponses} />
          </CardContent>
        </Card>
      </div>

      {/* 설문별 응답 현황 */}
      <DashboardStats surveyStats={surveyStats} />
    </div>
  );
}
```

**Step 3: 설문별 응답 통계 차트**

`src/components/admin/DashboardStats.tsx`:
```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SurveyStat {
  id: string;
  title: string;
  status: string;
  responseCount: number;
}

interface DashboardStatsProps {
  surveyStats: SurveyStat[];
}

const statusLabels: Record<string, string> = {
  draft: "초안",
  active: "진행중",
  closed: "마감",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  active: "default",
  closed: "destructive",
};

export function DashboardStats({ surveyStats }: DashboardStatsProps) {
  const chartData = surveyStats.map((s) => ({
    name: s.title.length > 10 ? s.title.slice(0, 10) + "..." : s.title,
    응답수: s.responseCount,
  }));

  return (
    <div className="space-y-6">
      {/* 바 차트 */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">설문별 응답 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="응답수" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 설문 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">설문 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {surveyStats.map((survey) => (
              <div
                key={survey.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariants[survey.status]}>
                    {statusLabels[survey.status]}
                  </Badge>
                  <span className="text-sm">{survey.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {survey.responseCount}명 응답
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: 실시간 응답 수 컴포넌트**

`src/components/admin/RealtimeResponseCount.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RealtimeResponseCountProps {
  initialCount: number;
}

export function RealtimeResponseCount({
  initialCount,
}: RealtimeResponseCountProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("respondents-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "respondents" },
        () => {
          setCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <p className="text-3xl font-bold">{count}</p>;
}
```

**Step 5: 커밋**

```bash
git add .
git commit -m "feat: add admin dashboard with stats charts and realtime counter"
```

---

### Task 11: 설문 CRUD 관리

**Files:**
- Create: `src/app/admin/surveys/page.tsx`
- Create: `src/app/admin/surveys/new/page.tsx`
- Create: `src/app/api/surveys/route.ts`
- Create: `src/app/api/surveys/[id]/route.ts`
- Create: `src/app/api/surveys/[id]/duplicate/route.ts`

**Step 1: 설문 목록 페이지**

`src/app/admin/surveys/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SurveyActions } from "@/components/admin/SurveyActions";

export default async function AdminSurveysPage() {
  const supabase = await createClient();

  const { data: surveys } = await supabase
    .from("surveys")
    .select("*, questions(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">설문 관리</h1>
        <Link href="/admin/surveys/new">
          <Button>새 설문 만들기</Button>
        </Link>
      </div>

      {(!surveys || surveys.length === 0) && (
        <p className="text-center text-muted-foreground py-8">
          등록된 설문이 없습니다.
        </p>
      )}

      <div className="grid gap-4">
        {surveys?.map((survey) => (
          <Card key={survey.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{survey.title}</CardTitle>
                <SurveyActions survey={survey} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge
                  variant={
                    survey.status === "active"
                      ? "default"
                      : survey.status === "draft"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {survey.status === "active"
                    ? "진행중"
                    : survey.status === "draft"
                    ? "초안"
                    : "마감"}
                </Badge>
                <span>
                  문항 {survey.questions?.[0]?.count || 0}개
                </span>
                <span>
                  {new Date(survey.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: 설문 액션 드롭다운 (상태변경, 복제, 삭제)**

`src/components/admin/SurveyActions.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Survey } from "@/lib/types";

interface SurveyActionsProps {
  survey: Survey;
}

export function SurveyActions({ survey }: SurveyActionsProps) {
  const router = useRouter();

  const updateStatus = async (status: string) => {
    await fetch(`/api/surveys/${survey.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };

  const duplicate = async () => {
    await fetch(`/api/surveys/${survey.id}/duplicate`, { method: "POST" });
    router.refresh();
  };

  const deleteSurvey = async () => {
    if (!confirm("정말 이 설문을 삭제하시겠습니까?")) return;
    await fetch(`/api/surveys/${survey.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          ...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/admin/surveys/${survey.id}`)}
        >
          문항 편집
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/admin/surveys/${survey.id}/responses`)}
        >
          응답 보기
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/admin/surveys/${survey.id}/share`)}
        >
          공유
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {survey.status === "draft" && (
          <DropdownMenuItem onClick={() => updateStatus("active")}>
            설문 시작 (활성화)
          </DropdownMenuItem>
        )}
        {survey.status === "active" && (
          <DropdownMenuItem onClick={() => updateStatus("closed")}>
            설문 마감
          </DropdownMenuItem>
        )}
        {survey.status === "closed" && (
          <DropdownMenuItem onClick={() => updateStatus("draft")}>
            초안으로 되돌리기
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={duplicate}>설문 복제</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={deleteSurvey} className="text-destructive">
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 3: 새 설문 생성 페이지**

`src/app/admin/surveys/new/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    if (res.ok) {
      const survey = await res.json();
      router.push(`/admin/surveys/${survey.id}`);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>새 설문 만들기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">설문 제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="2026 겨울수련회 설문조사"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="설문에 대한 간단한 설명..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? "생성 중..." : "생성"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: API Routes**

`src/app/api/surveys/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("surveys")
    .insert({
      title: body.title,
      description: body.description || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
```

`src/app/api/surveys/[id]/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { error } = await supabase
    .from("surveys")
    .update(body)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("surveys").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
```

`src/app/api/surveys/[id]/duplicate/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 원본 설문 조회
  const { data: original } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 설문 복제
  const { data: newSurvey, error: surveyError } = await supabase
    .from("surveys")
    .insert({
      title: `${original.title} (복사)`,
      description: original.description,
      status: "draft",
    })
    .select()
    .single();

  if (surveyError) return NextResponse.json({ error: surveyError.message }, { status: 400 });

  // 문항 복제
  if (original.questions && original.questions.length > 0) {
    const newQuestions = original.questions.map(
      (q: { type: string; title: string; description: string; options: unknown; required: boolean; order_index: number; condition: unknown }) => ({
        survey_id: newSurvey.id,
        type: q.type,
        title: q.title,
        description: q.description,
        options: q.options,
        required: q.required,
        order_index: q.order_index,
        condition: q.condition,
      })
    );

    await supabase.from("questions").insert(newQuestions);
  }

  return NextResponse.json(newSurvey);
}
```

**Step 5: 커밋**

```bash
git add .
git commit -m "feat: add survey CRUD management with duplicate and status change"
```

---

### Task 12: 문항 편집 페이지

**Files:**
- Create: `src/app/admin/surveys/[id]/page.tsx`
- Create: `src/components/admin/QuestionEditor.tsx`
- Create: `src/components/admin/QuestionForm.tsx`
- Create: `src/app/api/questions/route.ts`
- Create: `src/app/api/questions/[id]/route.ts`
- Create: `src/app/api/questions/reorder/route.ts`

**Step 1: 문항 편집 페이지**

`src/app/admin/surveys/[id]/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuestionEditor } from "@/components/admin/QuestionEditor";

export default async function SurveyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (!survey) notFound();

  const sortedQuestions = (survey.questions || []).sort(
    (a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        <p className="text-sm text-muted-foreground">문항 편집</p>
      </div>

      <QuestionEditor surveyId={id} initialQuestions={sortedQuestions} />
    </div>
  );
}
```

**Step 2: 문항 편집 컴포넌트**

`src/components/admin/QuestionEditor.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionForm } from "./QuestionForm";
import type { Question } from "@/lib/types";

interface QuestionEditorProps {
  surveyId: string;
  initialQuestions: Question[];
}

const typeLabels: Record<string, string> = {
  single_choice: "단일 선택",
  multiple_choice: "복수 선택",
  text: "주관식",
  rating: "평점",
  datetime: "날짜/시간",
};

export function QuestionEditor({
  surveyId,
  initialQuestions,
}: QuestionEditorProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleSaved = () => {
    setShowForm(false);
    setEditingQuestion(null);
    router.refresh();
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("이 문항을 삭제하시겠습니까?")) return;
    await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [
      newQuestions[index],
      newQuestions[index - 1],
    ];
    setQuestions(newQuestions);
    await fetch("/api/questions/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: newQuestions.map((q, i) => ({ id: q.id, order_index: i })),
      }),
    });
  };

  const handleMoveDown = async (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [
      newQuestions[index + 1],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
    await fetch("/api/questions/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: newQuestions.map((q, i) => ({ id: q.id, order_index: i })),
      }),
    });
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {index + 1}.
                </span>
                <CardTitle className="text-base">{question.title}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[question.type]}
                </Badge>
                {question.required && (
                  <Badge variant="destructive" className="text-xs">
                    필수
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                위로
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveDown(index)}
                disabled={index === questions.length - 1}
              >
                아래로
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingQuestion(question);
                  setShowForm(true);
                }}
              >
                수정
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => handleDelete(question.id)}
              >
                삭제
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {showForm ? (
        <QuestionForm
          surveyId={surveyId}
          question={editingQuestion}
          orderIndex={editingQuestion?.order_index ?? questions.length}
          allQuestions={questions}
          onSaved={handleSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
        />
      ) : (
        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
          + 문항 추가
        </Button>
      )}
    </div>
  );
}
```

**Step 3: 문항 생성/수정 폼**

`src/components/admin/QuestionForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question, QuestionOption, QuestionType } from "@/lib/types";

interface QuestionFormProps {
  surveyId: string;
  question: Question | null;
  orderIndex: number;
  allQuestions: Question[];
  onSaved: () => void;
  onCancel: () => void;
}

export function QuestionForm({
  surveyId,
  question,
  orderIndex,
  allQuestions,
  onSaved,
  onCancel,
}: QuestionFormProps) {
  const [type, setType] = useState<QuestionType>(
    question?.type || "single_choice"
  );
  const [title, setTitle] = useState(question?.title || "");
  const [description, setDescription] = useState(question?.description || "");
  const [required, setRequired] = useState(question?.required || false);
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options || [{ label: "", value: "" }]
  );
  const [hasCondition, setHasCondition] = useState(!!question?.condition);
  const [conditionQuestionId, setConditionQuestionId] = useState(
    question?.condition?.question_id || ""
  );
  const [conditionValue, setConditionValue] = useState(
    (question?.condition?.value as string) || ""
  );
  const [loading, setLoading] = useState(false);

  const needsOptions = type === "single_choice" || type === "multiple_choice";

  const handleAddOption = () => {
    setOptions([...options, { label: "", value: "" }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, label: string) => {
    const updated = [...options];
    updated[index] = { label, value: label.toLowerCase().replace(/\s+/g, "_") };
    setOptions(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);

    const body = {
      survey_id: surveyId,
      type,
      title,
      description: description || null,
      required,
      order_index: orderIndex,
      options: needsOptions ? options.filter((o) => o.label.trim()) : null,
      condition: hasCondition && conditionQuestionId
        ? {
            question_id: conditionQuestionId,
            operator: "equals",
            value: conditionValue,
          }
        : null,
    };

    if (question) {
      await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setLoading(false);
    onSaved();
  };

  // 조건부 문항에서 참조할 수 있는 이전 문항 (객관식만)
  const conditionCandidates = allQuestions.filter(
    (q) =>
      q.id !== question?.id &&
      (q.type === "single_choice" || q.type === "multiple_choice")
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {question ? "문항 수정" : "새 문항 추가"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 문항 유형 */}
        <div className="space-y-2">
          <Label>문항 유형</Label>
          <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single_choice">단일 선택</SelectItem>
              <SelectItem value="multiple_choice">복수 선택</SelectItem>
              <SelectItem value="text">주관식</SelectItem>
              <SelectItem value="rating">평점 (1~5)</SelectItem>
              <SelectItem value="datetime">날짜/시간</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 문항 제목 */}
        <div className="space-y-2">
          <Label>문항 제목</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문항을 입력하세요"
          />
        </div>

        {/* 설명 */}
        <div className="space-y-2">
          <Label>부연 설명 (선택)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="문항에 대한 추가 설명..."
            rows={2}
          />
        </div>

        {/* 객관식 보기 */}
        {needsOptions && (
          <div className="space-y-2">
            <Label>보기</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option.label}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`보기 ${index + 1}`}
                />
                {options.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
              + 보기 추가
            </Button>
          </div>
        )}

        {/* 필수 응답 */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="required"
            checked={required}
            onCheckedChange={(checked) => setRequired(checked === true)}
          />
          <Label htmlFor="required">필수 응답</Label>
        </div>

        {/* 조건부 문항 */}
        {conditionCandidates.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasCondition"
                checked={hasCondition}
                onCheckedChange={(checked) => setHasCondition(checked === true)}
              />
              <Label htmlFor="hasCondition">조건부 문항 (특정 답변 시에만 표시)</Label>
            </div>

            {hasCondition && (
              <div className="space-y-2 ml-6">
                <Select
                  value={conditionQuestionId}
                  onValueChange={setConditionQuestionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="조건 문항 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionCandidates.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {conditionQuestionId && (
                  <div className="space-y-1">
                    <Label className="text-sm">다음 값을 선택했을 때 표시:</Label>
                    <Select value={conditionValue} onValueChange={setConditionValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="값 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionCandidates
                          .find((q) => q.id === conditionQuestionId)
                          ?.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? "저장 중..." : question ? "수정" : "추가"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Questions API Routes**

`src/app/api/questions/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("questions")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
```

`src/app/api/questions/[id]/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { error } = await supabase
    .from("questions")
    .update(body)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
```

`src/app/api/questions/reorder/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orders } = await request.json();

  for (const { id, order_index } of orders) {
    await supabase
      .from("questions")
      .update({ order_index })
      .eq("id", id);
  }

  return NextResponse.json({ success: true });
}
```

**Step 5: 커밋**

```bash
git add .
git commit -m "feat: add question editor with CRUD, reordering, and conditional logic"
```

---

## Phase 4: 응답 분석 및 내보내기

### Task 13: 응답 상세 페이지 (통계 + 차트)

**Files:**
- Create: `src/app/admin/surveys/[id]/responses/page.tsx`
- Create: `src/components/admin/ResponseStats.tsx`
- Create: `src/components/admin/ResponseTable.tsx`

**Step 1: 응답 상세 페이지**

`src/app/admin/surveys/[id]/responses/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ResponseStats } from "@/components/admin/ResponseStats";
import { ResponseTable } from "@/components/admin/ResponseTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (!survey) notFound();

  const { data: respondents } = await supabase
    .from("respondents")
    .select("*, answers(*)")
    .eq("survey_id", id)
    .order("created_at", { ascending: false });

  const questions = (survey.questions || []).sort(
    (a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <p className="text-sm text-muted-foreground">
            총 {respondents?.length || 0}명 응답
          </p>
        </div>
        <Link href={`/api/surveys/${id}/export?format=xlsx`}>
          <Button variant="outline">Excel 내보내기</Button>
        </Link>
      </div>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">문항별 통계</TabsTrigger>
          <TabsTrigger value="responses">개별 응답</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <ResponseStats
            questions={questions}
            respondents={respondents || []}
          />
        </TabsContent>
        <TabsContent value="responses">
          <ResponseTable
            questions={questions}
            respondents={respondents || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 2: 문항별 통계 차트**

`src/components/admin/ResponseStats.tsx`:
```tsx
"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question, RespondentWithAnswers, AnswerValue } from "@/lib/types";

interface ResponseStatsProps {
  questions: Question[];
  respondents: RespondentWithAnswers[];
}

const COLORS = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#9333ea", "#f97316"];

export function ResponseStats({ questions, respondents }: ResponseStatsProps) {
  const getAnswersForQuestion = (questionId: string): AnswerValue[] => {
    return respondents
      .flatMap((r) => r.answers)
      .filter((a) => a.question_id === questionId)
      .map((a) => a.value as AnswerValue);
  };

  return (
    <div className="space-y-6">
      {questions.map((question) => {
        const answers = getAnswersForQuestion(question.id);

        return (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">{question.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {answers.length}명 응답
              </p>
            </CardHeader>
            <CardContent>
              {(question.type === "single_choice" ||
                question.type === "multiple_choice") && (
                <ChoiceStats question={question} answers={answers} />
              )}
              {question.type === "rating" && (
                <RatingStats answers={answers} />
              )}
              {question.type === "text" && (
                <TextStats answers={answers} />
              )}
              {question.type === "datetime" && (
                <DatetimeStats answers={answers} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ChoiceStats({
  question,
  answers,
}: {
  question: Question;
  answers: AnswerValue[];
}) {
  const counts: Record<string, number> = {};
  question.options?.forEach((opt) => (counts[opt.label] = 0));

  answers.forEach((a) => {
    const selected = a.selected;
    if (Array.isArray(selected)) {
      selected.forEach((s) => {
        const opt = question.options?.find((o) => o.value === s);
        if (opt) counts[opt.label] = (counts[opt.label] || 0) + 1;
      });
    } else if (selected) {
      const opt = question.options?.find((o) => o.value === selected);
      if (opt) counts[opt.label] = (counts[opt.label] || 0) + 1;
    }
  });

  const chartData = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={100} fontSize={12} />
          <Tooltip />
          <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RatingStats({ answers }: { answers: AnswerValue[] }) {
  const ratings = answers.map((a) => a.rating).filter((r): r is number => r !== undefined);
  const avg = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
    : "0";

  const distribution = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}점`,
    count: ratings.filter((v) => v === r).length,
  }));

  return (
    <div className="space-y-4">
      <p className="text-2xl font-bold text-center">평균 {avg}점</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={distribution}>
          <XAxis dataKey="rating" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#eab308" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TextStats({ answers }: { answers: AnswerValue[] }) {
  const texts = answers.map((a) => a.text).filter((t): t is string => !!t);

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {texts.length === 0 && (
        <p className="text-muted-foreground">응답 없음</p>
      )}
      {texts.map((text, i) => (
        <div key={i} className="p-2 bg-muted rounded text-sm">
          {text}
        </div>
      ))}
    </div>
  );
}

function DatetimeStats({ answers }: { answers: AnswerValue[] }) {
  const dates = answers
    .map((a) => a.datetime)
    .filter((d): d is string => !!d);

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {dates.length === 0 && (
        <p className="text-muted-foreground">응답 없음</p>
      )}
      {dates.map((dt, i) => (
        <div key={i} className="p-2 bg-muted rounded text-sm">
          {new Date(dt).toLocaleString("ko-KR")}
        </div>
      ))}
    </div>
  );
}
```

**Step 3: 개별 응답 테이블**

`src/components/admin/ResponseTable.tsx`:
```tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Question, RespondentWithAnswers, AnswerValue } from "@/lib/types";

interface ResponseTableProps {
  questions: Question[];
  respondents: RespondentWithAnswers[];
}

function formatAnswer(question: Question, value: AnswerValue | undefined): string {
  if (!value) return "-";

  switch (question.type) {
    case "single_choice": {
      const selected = value.selected as string;
      return question.options?.find((o) => o.value === selected)?.label || selected || "-";
    }
    case "multiple_choice": {
      const selected = value.selected as string[];
      return (
        selected
          ?.map((s) => question.options?.find((o) => o.value === s)?.label || s)
          .join(", ") || "-"
      );
    }
    case "text":
      return value.text || "-";
    case "rating":
      return value.rating !== undefined ? `${value.rating}점` : "-";
    case "datetime":
      return value.datetime
        ? new Date(value.datetime).toLocaleString("ko-KR")
        : "-";
    default:
      return "-";
  }
}

export function ResponseTable({
  questions,
  respondents,
}: ResponseTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-white">이름</TableHead>
            <TableHead>응답일시</TableHead>
            {questions.map((q) => (
              <TableHead key={q.id} className="min-w-[150px]">
                {q.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {respondents.map((respondent) => (
            <TableRow key={respondent.id}>
              <TableCell className="sticky left-0 bg-white font-medium">
                {respondent.name}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(respondent.created_at).toLocaleString("ko-KR")}
              </TableCell>
              {questions.map((q) => {
                const answer = respondent.answers.find(
                  (a) => a.question_id === q.id
                );
                return (
                  <TableCell key={q.id} className="text-sm">
                    {formatAnswer(q, answer?.value as AnswerValue | undefined)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Step 4: 커밋**

```bash
git add .
git commit -m "feat: add response statistics with charts and individual response table"
```

---

### Task 14: 데이터 내보내기 (Excel/CSV)

**Files:**
- Create: `src/app/api/surveys/[id]/export/route.ts`
- Modify: `package.json` (xlsx 의존성)

**Step 1: xlsx 패키지 설치**

```bash
npm install xlsx
```

**Step 2: 내보내기 API Route**

`src/app/api/surveys/[id]/export/route.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { Question, AnswerValue } from "@/lib/types";

function formatAnswerValue(
  question: Question,
  value: AnswerValue | undefined
): string {
  if (!value) return "";

  switch (question.type) {
    case "single_choice": {
      const selected = value.selected as string;
      return (
        question.options?.find((o) => o.value === selected)?.label ||
        selected ||
        ""
      );
    }
    case "multiple_choice": {
      const selected = value.selected as string[];
      return (
        selected
          ?.map((s) => question.options?.find((o) => o.value === s)?.label || s)
          .join(", ") || ""
      );
    }
    case "text":
      return value.text || "";
    case "rating":
      return value.rating !== undefined ? String(value.rating) : "";
    case "datetime":
      return value.datetime
        ? new Date(value.datetime).toLocaleString("ko-KR")
        : "";
    default:
      return "";
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: survey } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (!survey)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: respondents } = await supabase
    .from("respondents")
    .select("*, answers(*)")
    .eq("survey_id", id)
    .order("created_at", { ascending: true });

  const questions = (survey.questions || []).sort(
    (a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index
  ) as Question[];

  // 데이터 행 생성
  const rows = (respondents || []).map((respondent) => {
    const row: Record<string, string> = {
      이름: respondent.name,
      응답일시: new Date(respondent.created_at).toLocaleString("ko-KR"),
    };

    questions.forEach((q) => {
      const answer = respondent.answers.find(
        (a: { question_id: string }) => a.question_id === q.id
      );
      row[q.title] = formatAnswerValue(
        q,
        answer?.value as AnswerValue | undefined
      );
    });

    return row;
  });

  // URL 파라미터로 포맷 결정
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "xlsx";

  const workbook = XLSX.utils.book_new();

  // 요약 시트
  const summaryData = [
    ["설문 제목", survey.title],
    ["총 응답 수", String(respondents?.length || 0)],
    ["내보내기 일시", new Date().toLocaleString("ko-KR")],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "요약");

  // 응답 데이터 시트
  const dataSheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, dataSheet, "응답 데이터");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: format === "csv" ? "csv" : "xlsx",
  });

  const filename = `${survey.title}_응답_${new Date().toISOString().slice(0, 10)}`;
  const contentType =
    format === "csv"
      ? "text/csv"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}.${format}"`,
    },
  });
}
```

**Step 3: 커밋**

```bash
git add .
git commit -m "feat: add survey response export to Excel/CSV"
```

---

## Phase 5: 공유 및 마무리

### Task 15: 설문 공유 페이지 (QR코드 + 링크)

**Files:**
- Create: `src/app/admin/surveys/[id]/share/page.tsx`
- Create: `src/components/admin/SharePanel.tsx`
- Modify: `package.json` (qrcode 의존성)

**Step 1: QR코드 패키지 설치**

```bash
npm install qrcode @types/qrcode
```

**Step 2: 공유 페이지**

`src/app/admin/surveys/[id]/share/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SharePanel } from "@/components/admin/SharePanel";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, title, status")
    .eq("id", id)
    .single();

  if (!survey) notFound();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{survey.title}</h1>
      <p className="text-sm text-muted-foreground">설문 공유</p>
      <SharePanel surveyId={survey.id} />
    </div>
  );
}
```

**Step 3: 공유 패널 (QR코드 + 링크 복사)**

`src/components/admin/SharePanel.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SharePanelProps {
  surveyId: string;
}

export function SharePanel({ surveyId }: SharePanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const surveyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/survey/${surveyId}`
      : "";

  useEffect(() => {
    if (surveyUrl) {
      QRCode.toDataURL(surveyUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl);
    }
  }, [surveyUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.download = `survey-qr-${surveyId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* 링크 공유 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">설문 링크</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={surveyUrl} readOnly className="text-sm" />
            <Button onClick={handleCopy} variant="outline">
              {copied ? "복사됨!" : "복사"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR코드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR코드</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="Survey QR Code"
              className="w-64 h-64"
            />
          )}
          <Button onClick={handleDownloadQR} variant="outline">
            QR코드 다운로드
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: 커밋**

```bash
git add .
git commit -m "feat: add survey sharing page with QR code and link copy"
```

---

### Task 16: 최종 정리 및 배포 준비

**Files:**
- Modify: `src/app/layout.tsx` (메타데이터)
- Create: `.env.example`

**Step 1: 메타데이터 설정**

`src/app/layout.tsx` 의 metadata 부분 수정:
```tsx
export const metadata = {
  title: "겨울수련회 설문조사",
  description: "겨울수련회 설문조사 웹 애플리케이션",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};
```

**Step 2: 환경 변수 예제 파일**

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Step 3: 빌드 확인**

```bash
npm run build
```

오류 없이 빌드되는지 확인.

**Step 4: 최종 커밋**

```bash
git add .
git commit -m "chore: add metadata and env example for deployment"
```

**Step 5: Vercel 배포**

```bash
npx vercel
```

Vercel 프롬프트를 따라 프로젝트 연결 및 배포. 환경 변수는 Vercel 대시보드에서 설정.

---

## 구현 순서 요약

| Phase | Task | 내용 |
|-------|------|------|
| 1 | 1-5 | 프로젝트 스캐폴딩, shadcn/ui, Supabase, 타입, DB 스키마 |
| 2 | 6-8 | 응답자 화면 (메인, 설문 폼, 완료 페이지) |
| 3 | 9-12 | 관리자 인증, 대시보드, 설문 CRUD, 문항 편집 |
| 4 | 13-14 | 응답 통계/차트, Excel/CSV 내보내기 |
| 5 | 15-16 | QR코드/공유, 배포 준비 |

각 Phase 완료 후 중간 점검을 권장합니다.
