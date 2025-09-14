"use client";
import { Heading, Paragraph } from "components/documentation";
import type { JobAnalysisResult } from "./types";

interface AnalysisResultsProps {
  result: JobAnalysisResult;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  return (
    <div className="mt-6 space-y-6">
      {/* Job Details */}
      <section>
        <Heading level={2} className="!mt-6 !mb-3">
          Job Overview
        </Heading>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Title:</strong> {result.jobDetails.title}
            </div>
            <div>
              <strong>Company:</strong> {result.jobDetails.company}
            </div>
            <div>
              <strong>Location:</strong> {result.jobDetails.location}
            </div>
            <div>
              <strong>Experience:</strong> {result.jobDetails.experienceLevel}
            </div>
            <div>
              <strong>Type:</strong> {result.jobDetails.jobType}
            </div>
            {result.jobDetails.department && (
              <div>
                <strong>Department:</strong> {result.jobDetails.department}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Required Skills */}
      <section>
        <Heading level={2} className="!mb-3">
          Required Skills
        </Heading>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Technical Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {result.requiredSkills.technical.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Soft Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {result.requiredSkills.soft.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {result.requiredSkills.certifications && result.requiredSkills.certifications.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Certifications:</h4>
              <div className="flex flex-wrap gap-2">
                {result.requiredSkills.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Company Insights */}
      {result.companyInsights.about && (
        <section>
          <Heading level={2} className="!mb-3">
            Company Insights
          </Heading>
          <div className="bg-gray-50 rounded-lg p-4">
            {result.companyInsights.about && (
              <div className="mb-3">
                <strong>About:</strong>
                <Paragraph smallMarginTop={true}>{result.companyInsights.about}</Paragraph>
              </div>
            )}

            {result.companyInsights.recentNews && result.companyInsights.recentNews.length > 0 && (
              <div className="mb-3">
                <strong>Recent News:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {result.companyInsights.recentNews.map((news, index) => (
                    <li key={index} className="text-sm">{news}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {result.companyInsights.size && (
                <div>
                  <strong>Company Size:</strong> {result.companyInsights.size}
                </div>
              )}
              {result.companyInsights.industry && (
                <div>
                  <strong>Industry:</strong> {result.companyInsights.industry}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Salary Information */}
      {result.salaryInfo.range && (
        <section>
          <Heading level={2} className="!mb-3">
            Salary Information
          </Heading>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-lg font-semibold text-green-800 mb-2">
              {result.salaryInfo.range.currency} {result.salaryInfo.range.min.toLocaleString()} - {result.salaryInfo.range.max.toLocaleString()}
            </div>
            {result.salaryInfo.note && (
              <Paragraph className="text-sm text-green-700">
                {result.salaryInfo.note}
              </Paragraph>
            )}
          </div>
        </section>
      )}

      {/* Application Tips */}
      <section>
        <Heading level={2} className="!mb-3">
          Resume Optimization Tips
        </Heading>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Keywords to Include:</h4>
            <div className="flex flex-wrap gap-2">
              {result.applicationTips.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Important Qualifications:</h4>
            <ul className="list-disc list-inside space-y-1">
              {result.applicationTips.importantQualifications.map((qual, index) => (
                <li key={index} className="text-sm">{qual}</li>
              ))}
            </ul>
          </div>

          {result.applicationTips.applicationMethod && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="font-semibold text-blue-800 mb-1">Application Method:</h4>
              <p className="text-sm text-blue-700">{result.applicationTips.applicationMethod}</p>
            </div>
          )}
        </div>
      </section>

      {/* Similar Roles */}
      {result.similarRoles && result.similarRoles.length > 0 && (
        <section>
          <Heading level={2} className="!mb-3">
            Similar Open Roles
          </Heading>
          <div className="space-y-2">
            {result.similarRoles.map((role, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="font-medium">{role.title}</div>
                <div className="text-sm text-gray-600">{role.company}</div>
                {role.url && (
                  <a
                    href={role.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Job →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};