export interface JobAnalysisResult {
  jobDetails: {
    title: string;
    company: string;
    location: string;
    experienceLevel: string;
    jobType: string; // Full-time, Part-time, Contract, etc.
    department?: string;
  };

  requiredSkills: {
    technical: string[];
    soft: string[];
    certifications?: string[];
    experience?: string[];
  };

  companyInsights: {
    about?: string;
    recentNews?: string[];
    size?: string;
    industry?: string;
    culture?: string[];
  };

  salaryInfo: {
    range?: {
      min: number;
      max: number;
      currency: string;
    };
    sources?: string[];
    note?: string;
  };

  applicationTips: {
    keywords: string[];
    importantQualifications: string[];
    preferredExperience: string[];
    applicationMethod?: string; // Apply on portal, email recruiter, etc.
    contactInfo?: {
      recruiterName?: string;
      recruiterLinkedIn?: string;
      hrContact?: string;
    };
  };

  similarRoles?: {
    title: string;
    company: string;
    url?: string;
  }[];
}