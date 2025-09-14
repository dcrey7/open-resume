import { NextRequest, NextResponse } from 'next/server';
import type { JobAnalysisResult } from '../../job-analysis/types';
import { LLMService } from '../../lib/job-analysis/llm-service';
import { WebSearchService } from '../../lib/job-analysis/web-search';

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const llmService = new LLMService();
    const searchService = new WebSearchService();

    // Analyze job with LLM
    const llmAnalysis = await llmService.analyzeJob({ jobDescription });

    // Extract basic info for search
    const companyName = llmAnalysis.jobDetails?.company || 'TechCorp';
    const jobTitle = llmAnalysis.jobDetails?.title || 'Software Engineer';
    const location = llmAnalysis.jobDetails?.location || 'Remote';

    // Perform web searches in parallel
    const [companyInfo, salaryInfo, similarRoles] = await Promise.all([
      searchService.searchCompanyInfo(companyName),
      searchService.searchSalaryInfo(jobTitle, location, companyName),
      searchService.searchSimilarRoles(jobTitle, location),
    ]);

    // Combine all results
    const analysisResult: JobAnalysisResult = {
      jobDetails: llmAnalysis.jobDetails || {
        title: jobTitle,
        company: companyName,
        location: location,
        experienceLevel: 'Mid Level',
        jobType: 'Full-time',
      },
      requiredSkills: llmAnalysis.requiredSkills || {
        technical: ['React', 'TypeScript', 'JavaScript'],
        soft: ['Communication', 'Problem Solving'],
        certifications: [],
        experience: [],
      },
      companyInsights: companyInfo,
      salaryInfo: salaryInfo,
      applicationTips: llmAnalysis.applicationTips || {
        keywords: ['React', 'TypeScript', 'JavaScript'],
        importantQualifications: ['Strong technical skills'],
        preferredExperience: ['Similar role experience'],
        applicationMethod: 'Apply through company website',
      },
      similarRoles: similarRoles,
    };

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Job analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
}

