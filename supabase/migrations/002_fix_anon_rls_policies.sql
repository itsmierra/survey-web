-- Fix: 비로그인(anon) 사용자가 설문 제출 시 respondents/answers 읽기/삭제 불가 문제
-- 원인: SELECT/DELETE 정책이 authenticated만 허용하여 .insert().select() 체인이 실패

-- 응답자: 활성 설문의 응답자 정보 읽기 허용 (이름 중복 체크 + insert().select() 용)
CREATE POLICY "Anyone can read respondents for active surveys"
  ON respondents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = respondents.survey_id
      AND surveys.status = 'active'
    )
  );

-- 응답: 활성 설문의 답변 읽기 허용 (수정 모드에서 기존 답변 불러오기)
CREATE POLICY "Anyone can read answers for active surveys"
  ON answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM respondents
      JOIN surveys ON surveys.id = respondents.survey_id
      WHERE respondents.id = answers.respondent_id
      AND surveys.status = 'active'
    )
  );

-- 응답: 활성 설문의 답변 삭제 허용 (수정 모드에서 기존 답변 교체)
CREATE POLICY "Anyone can delete answers for active surveys"
  ON answers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM respondents
      JOIN surveys ON surveys.id = respondents.survey_id
      WHERE respondents.id = answers.respondent_id
      AND surveys.status = 'active'
    )
  );
