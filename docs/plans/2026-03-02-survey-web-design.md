# 겨울수련회 설문조사 웹 애플리케이션 설계

## 개요

겨울수련회 참가자들이 모바일/태블릿으로 설문에 응답하고, 관리자가 대시보드에서 설문을 관리하고 결과를 분석할 수 있는 웹 애플리케이션.

- **대상 규모**: 50~200명 응답자
- **응답자 인증**: 이름 입력만 (로그인 없음)
- **관리자 인증**: Supabase Auth (이메일/비밀번호)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS 4 |
| UI 컴포넌트 | shadcn/ui |
| 차트 | Recharts |
| DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (관리자 전용) |
| 내보내기 | xlsx 라이브러리 |
| QR코드 | qrcode 라이브러리 |
| 배포 | Vercel |

---

## 아키텍처

```
┌─────────────────────────────────────────────┐
│                  Vercel                      │
│  ┌───────────────────────────────────────┐   │
│  │   Next.js 15 (App Router)             │   │
│  │                                       │   │
│  │  /              → 설문 목록/접속       │   │
│  │  /survey/[id]   → 설문 응답           │   │
│  │  /admin         → 관리자 대시보드      │   │
│  │  /admin/surveys → 문항 관리           │   │
│  │  /api/...       → API Routes          │   │
│  └──────────────┬────────────────────────┘   │
└─────────────────┼────────────────────────────┘
                  │ Supabase JS SDK
                  ▼
┌─────────────────────────────────────────────┐
│              Supabase                        │
│  PostgreSQL + Row Level Security             │
│  + Realtime (실시간 응답 현황)                │
└─────────────────────────────────────────────┘
```

---

## 데이터 모델

### surveys (설문)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| title | TEXT | 설문 제목 |
| description | TEXT | 설문 설명 |
| status | ENUM | draft / active / closed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### questions (문항)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| survey_id | UUID (FK → surveys) | |
| type | ENUM | single_choice / multiple_choice / text / rating / datetime |
| title | TEXT | 문항 제목 |
| description | TEXT | 문항 부연설명 (선택) |
| options | JSONB | 객관식 보기 `[{label, value}]` |
| required | BOOLEAN | 필수 응답 여부 |
| order_index | INT | 문항 순서 |
| condition | JSONB | 조건부 표시 규칙 `{question_id, operator, value}` |
| created_at | TIMESTAMP | |

### respondents (응답자)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| survey_id | UUID (FK → surveys) | |
| name | TEXT | 응답자 이름 |
| created_at | TIMESTAMP | |
| UNIQUE(survey_id, name) | | 중복 응답 방지 |

### answers (응답)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| respondent_id | UUID (FK → respondents) | |
| question_id | UUID (FK → questions) | |
| value | JSONB | 응답 값 (유형별 유연) |
| created_at | TIMESTAMP | |

#### value JSONB 형식

- 단일 객관식: `{"selected": "option1"}`
- 복수 객관식: `{"selected": ["option1", "option2"]}`
- 주관식: `{"text": "자유 텍스트"}`
- 평점: `{"rating": 4}`
- 날짜/시간: `{"datetime": "2026-01-15T09:00"}`

---

## 문항 유형

| 유형 | 설명 | UI 컴포넌트 |
|------|------|-------------|
| single_choice | 단일 선택 객관식 | Radio 버튼 그룹 |
| multiple_choice | 복수 선택 객관식 | Checkbox 그룹 |
| text | 주관식 텍스트 | Textarea |
| rating | 평점 (1~5점) | Star 또는 숫자 버튼 |
| datetime | 날짜/시간 선택 | Date/Time Picker |

---

## 페이지 구조 및 기능

### 응답자 화면 (모바일 퍼스트)

| 경로 | 기능 |
|------|------|
| `/` | 활성 설문 목록, 이름 입력 후 설문 시작 |
| `/survey/[id]` | 설문 응답 폼 (진행률 프로그레스바 표시) |
| `/survey/[id]/complete` | 제출 완료 감사 화면 |

**응답자 UX:**
- 이름 입력 → 이미 응답한 이름이면 안내 메시지 (중복 방지)
- 문항별 진행률 표시 (예: "3/10 문항")
- 필수 문항 미응답 시 제출 불가 + 안내
- 조건부 문항: 이전 답변에 따라 자동 표시/숨김
- 모바일에서 편한 큰 터치 영역, 세로 스크롤 폼

### 관리자 화면

| 경로 | 기능 |
|------|------|
| `/admin/login` | 관리자 로그인 |
| `/admin` | 대시보드 - 전체 응답률, 설문별 요약, 실시간 응답 현황 |
| `/admin/surveys` | 설문 목록 관리 (생성/수정/삭제/상태변경/복제) |
| `/admin/surveys/new` | 새 설문 생성 |
| `/admin/surveys/[id]` | 문항 편집 (드래그 정렬, 추가/수정/삭제) |
| `/admin/surveys/[id]/responses` | 응답 상세 - 문항별 통계 차트 + 개별 응답 목록 |
| `/admin/surveys/[id]/share` | 공유 링크 + QR코드 생성 |

---

## 핵심 기능 상세

### 1. 관리자 대시보드

- 전체 설문 수, 총 응답 수, 오늘 응답 수
- 설문별 응답률 바 차트
- 실시간 응답 현황 (Supabase Realtime 구독)
- 최근 응답 타임라인

### 2. 문항별 통계 (응답 상세 페이지)

- 객관식: 파이 차트 / 바 차트로 선택지별 비율
- 평점: 평균 점수 + 분포 히스토그램
- 주관식: 응답 목록 나열
- 날짜/시간: 날짜별 분포

### 3. 데이터 내보내기

- CSV 내보내기: 응답자별 행, 문항별 열
- Excel 내보내기: 요약 시트 + 원본 데이터 시트

### 4. 설문 공유

- 고유 URL 생성 및 복사
- QR코드 이미지 생성 및 다운로드
- 카카오톡/문자 공유 가능한 형태

### 5. 조건부 문항

- 문항 편집 시 "조건 추가" 옵션
- 특정 문항의 답변이 특정 값일 때만 표시
- 예: "참가 여부" → "참가"를 선택한 사람에게만 추가 문항 표시

### 6. 설문 복제

- 기존 설문의 문항 구조를 그대로 복사하여 새 설문 생성
- 설문 제목에 "(복사)" 접미사 추가

### 7. 실시간 응답 현황

- Supabase Realtime 구독으로 새 응답 즉시 반영
- 대시보드에서 응답 수 실시간 업데이트
- 응답 상세 페이지에서도 실시간 차트 갱신

---

## 보안 고려사항

- 관리자 페이지: Supabase Auth + 미들웨어로 보호
- RLS (Row Level Security): 관리자만 설문/문항 CRUD 가능
- 응답자: 설문 응답만 가능 (활성 설문에 한해)
- API Rate Limiting: Vercel Edge Middleware 활용

---

## 디렉토리 구조 (예정)

```
survey_web/
├── src/
│   ├── app/
│   │   ├── (respondent)/          # 응답자 레이아웃
│   │   │   ├── page.tsx           # 메인 (설문 목록)
│   │   │   └── survey/[id]/
│   │   │       ├── page.tsx       # 설문 응답
│   │   │       └── complete/
│   │   │           └── page.tsx   # 제출 완료
│   │   ├── admin/                 # 관리자 레이아웃
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx           # 대시보드
│   │   │   └── surveys/
│   │   │       ├── page.tsx       # 설문 목록
│   │   │       ├── new/page.tsx   # 새 설문
│   │   │       └── [id]/
│   │   │           ├── page.tsx       # 문항 편집
│   │   │           ├── responses/page.tsx  # 응답 상세
│   │   │           └── share/page.tsx      # 공유
│   │   └── api/                   # API Routes
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 컴포넌트
│   │   ├── survey/                # 설문 관련 컴포넌트
│   │   ├── admin/                 # 관리자 관련 컴포넌트
│   │   └── charts/                # 차트 컴포넌트
│   ├── lib/
│   │   ├── supabase/              # Supabase 클라이언트/서버
│   │   ├── utils.ts
│   │   └── types.ts               # TypeScript 타입 정의
│   └── hooks/                     # 커스텀 훅
├── public/
├── docs/plans/
└── supabase/
    └── migrations/                # DB 마이그레이션
```
