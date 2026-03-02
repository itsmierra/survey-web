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
