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
