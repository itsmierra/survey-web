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
