"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseStats } from "@/components/admin/ResponseStats";
import { ResponseTable } from "@/components/admin/ResponseTable";
import { ResponseFilter, applyFilters } from "@/components/admin/ResponseFilter";
import Link from "next/link";
import type { Question, RespondentWithAnswers } from "@/lib/types";

interface ResponsesPageContentProps {
  surveyId: string;
  surveyTitle: string;
  questions: Question[];
  respondents: RespondentWithAnswers[];
}

export function ResponsesPageContent({
  surveyId,
  surveyTitle,
  questions,
  respondents,
}: ResponsesPageContentProps) {
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | null>
  >({});

  const filteredRespondents = useMemo(
    () => applyFilters(respondents, questions, activeFilters),
    [respondents, questions, activeFilters]
  );

  const handleFilterChange = (questionId: string, value: string | null) => {
    setActiveFilters((prev) => ({ ...prev, [questionId]: value }));
  };

  const isFiltered = Object.values(activeFilters).some((v) => v !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{surveyTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {isFiltered
              ? `${filteredRespondents.length}명 / 총 ${respondents.length}명 응답`
              : `총 ${respondents.length}명 응답`}
          </p>
        </div>
        <Link href={`/api/surveys/${surveyId}/export?format=xlsx`}>
          <Button variant="outline">Excel 내보내기</Button>
        </Link>
      </div>

      <ResponseFilter
        questions={questions}
        respondents={respondents}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">문항별 통계</TabsTrigger>
          <TabsTrigger value="responses">개별 응답</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <ResponseStats
            questions={questions}
            respondents={filteredRespondents}
          />
        </TabsContent>
        <TabsContent value="responses">
          <ResponseTable
            questions={questions}
            respondents={filteredRespondents}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
