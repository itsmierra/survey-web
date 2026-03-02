"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  Question,
  RespondentWithAnswers,
  SurveyWithQuestions,
} from "@/lib/types";

interface SurveyWithRespondents extends SurveyWithQuestions {
  respondents: RespondentWithAnswers[];
}

interface TeamResponseStatusProps {
  surveys: SurveyWithRespondents[];
}

interface TeamGroup {
  teamName: string;
  respondents: string[];
}

function findTeamQuestion(questions: Question[]): Question | null {
  return (
    questions.find(
      (q) =>
        (q.type === "single_choice" || q.type === "multiple_choice") &&
        q.title.includes("팀")
    ) ?? null
  );
}

function groupByTeam(
  teamQuestion: Question,
  respondents: RespondentWithAnswers[]
): TeamGroup[] {
  const options = teamQuestion.options || [];
  return options.map((opt) => {
    const members = respondents.filter((r) =>
      r.answers.some((a) => {
        if (a.question_id !== teamQuestion.id) return false;
        const selected = a.value?.selected;
        if (Array.isArray(selected)) return selected.includes(opt.value);
        return selected === opt.value;
      })
    );
    return {
      teamName: opt.label,
      respondents: members.map((m) => m.name),
    };
  });
}

export function TeamResponseStatus({ surveys }: TeamResponseStatusProps) {
  const surveyTeamData = useMemo(() => {
    return surveys
      .map((survey) => {
        const teamQuestion = findTeamQuestion(survey.questions);
        if (!teamQuestion) return null;
        const groups = groupByTeam(teamQuestion, survey.respondents);
        return {
          surveyTitle: survey.title,
          totalRespondents: survey.respondents.length,
          groups,
        };
      })
      .filter(Boolean) as {
      surveyTitle: string;
      totalRespondents: number;
      groups: TeamGroup[];
    }[];
  }, [surveys]);

  if (surveyTeamData.length === 0) return null;

  return (
    <div className="space-y-4">
      {surveyTeamData.map((data) => (
        <Card key={data.surveyTitle} className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              </span>
              팀별 작성현황
              <Badge variant="secondary" className="ml-auto">
                {data.surveyTitle}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.groups.map((group) => (
                <div
                  key={group.teamName}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {group.teamName}
                    </span>
                    <Badge variant="outline">
                      {group.respondents.length}명
                    </Badge>
                  </div>
                  {group.respondents.length > 0 ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {group.respondents.join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      아직 응답 없음
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-right">
              전체 {data.totalRespondents}명 응답
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
