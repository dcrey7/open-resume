"use client";
import { useState } from "react";
import { PrimaryButton, Button } from "components/Button";

interface JobDescriptionInputProps {
  onAnalyze: (jobDescription: string) => void;
  isAnalyzing: boolean;
}

export const JobDescriptionInput = ({
  onAnalyze,
  isAnalyzing,
}: JobDescriptionInputProps) => {
  const [jobDescription, setJobDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobDescription.trim() && !isAnalyzing) {
      onAnalyze(jobDescription);
    }
  };

  const handleExample = () => {
    const exampleJD = `Senior Software Engineer - Frontend
Company: TechCorp Inc.
Location: San Francisco, CA

About the Role:
We are seeking a Senior Frontend Engineer to join our growing team. You will be responsible for building and maintaining user-facing applications using React, TypeScript, and modern web technologies.

Requirements:
• 5+ years of experience in frontend development
• Expert knowledge of React, TypeScript, JavaScript
• Experience with Next.js, Redux, and modern CSS frameworks
• Strong understanding of web performance optimization
• Experience with testing frameworks (Jest, React Testing Library)
• Bachelor's degree in Computer Science or equivalent experience

Preferred Qualifications:
• Experience with GraphQL and Apollo Client
• Knowledge of design systems and component libraries
• Previous experience at a high-growth startup
• Experience with CI/CD pipelines

Benefits:
• Competitive salary ($150,000 - $200,000)
• Equity package
• Health insurance
• Remote-friendly culture

How to Apply:
Send your resume to careers@techcorp.com or apply through our careers page.`;

    setJobDescription(exampleJD);
  };

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="job-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the complete job description here..."
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isAnalyzing}
          />
        </div>

        <div className="flex gap-3">
          <PrimaryButton
            type="submit"
            disabled={!jobDescription.trim() || isAnalyzing}
            className={isAnalyzing || !jobDescription.trim() ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Job Description"}
          </PrimaryButton>

          <Button
            type="button"
            onClick={handleExample}
            disabled={isAnalyzing}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load Example
          </Button>
        </div>
      </form>

      {jobDescription && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Character count:</strong> {jobDescription.length}
            <br />
            <strong>Word count:</strong> {jobDescription.split(/\s+/).filter(word => word.length > 0).length}
          </p>
        </div>
      )}
    </div>
  );
};