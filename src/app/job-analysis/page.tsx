"use client";
import { useState } from "react";
import { Heading, Paragraph } from "components/documentation";
import { JobDescriptionInput } from "./JobDescriptionInput";
import { AnalysisResults } from "./AnalysisResults";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import type { JobAnalysisResult } from "./types";

export default function JobAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<JobAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysis = async (jobDescription: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Job analysis failed:', error);
      // Handle error state
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="h-full w-full overflow-hidden">
      <div className="grid md:grid-cols-2">
        <div className="flex justify-center px-2 md:h-[calc(100vh-var(--top-nav-bar-height))] md:justify-end">
          <section className="mt-5 grow px-4 md:max-w-[600px] md:px-0">
            <Heading className="text-primary !mt-4">
              Job Description Analysis
            </Heading>
            <Paragraph smallMarginTop={true}>
              Paste a job description to get detailed insights about the role, company,
              required skills, salary ranges, and optimization tips for your resume.
            </Paragraph>

            <JobDescriptionInput
              onAnalyze={handleAnalysis}
              isAnalyzing={isAnalyzing}
            />
          </section>
          <FlexboxSpacer maxWidth={45} className="hidden md:block" />
        </div>

        <div className="flex px-6 text-gray-900 md:h-[calc(100vh-var(--top-nav-bar-height))] md:overflow-y-scroll">
          <FlexboxSpacer maxWidth={45} className="hidden md:block" />
          <section className="max-w-[600px] grow">
            {analysisResult ? (
              <AnalysisResults result={analysisResult} />
            ) : (
              <div className="mt-8 text-center text-gray-500">
                <Paragraph>
                  Analysis results will appear here after you submit a job description.
                </Paragraph>
              </div>
            )}
            <div className="pt-24" />
          </section>
        </div>
      </div>
    </main>
  );
}