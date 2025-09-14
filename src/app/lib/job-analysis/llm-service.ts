import type { JobAnalysisResult } from '../../job-analysis/types';

interface LLMAnalysisPrompt {
  jobDescription: string;
  companyInfo?: string;
  salaryData?: string;
}

export class LLMService {
  private apiKey: string;
  private baseUrl: string;
  private provider: 'groq' | 'openai' | 'anthropic';

  constructor() {
    // Priority: Groq > OpenAI > Anthropic
    if (process.env.GROQ_API_KEY) {
      this.apiKey = process.env.GROQ_API_KEY;
      this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
      this.provider = 'groq';
    } else if (process.env.OPENAI_API_KEY) {
      this.apiKey = process.env.OPENAI_API_KEY;
      this.baseUrl = 'https://api.openai.com/v1/chat/completions';
      this.provider = 'openai';
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.apiKey = process.env.ANTHROPIC_API_KEY;
      this.baseUrl = 'https://api.anthropic.com/v1/messages';
      this.provider = 'anthropic';
    } else {
      this.apiKey = '';
      this.baseUrl = '';
      this.provider = 'groq';
    }
  }

  async analyzeJob(prompt: LLMAnalysisPrompt): Promise<Partial<JobAnalysisResult>> {
    if (!this.apiKey) {
      // Return mock data if no API key is configured
      return this.getMockAnalysis(prompt.jobDescription);
    }

    try {
      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.getUserPrompt(prompt);

      const response = await this.callLLMAPI(systemPrompt, userPrompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('LLM API error:', error);
      return this.getMockAnalysis(prompt.jobDescription);
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert job market analyst and resume optimization specialist. Analyze job descriptions and provide detailed insights in strict JSON format.

CRITICAL: Your response must be valid JSON only. No markdown, no explanations, no text outside the JSON object.

Return exactly this JSON structure:
{
  "jobDetails": {
    "title": "exact job title from posting",
    "company": "company name",
    "location": "job location (Remote/City, State)",
    "experienceLevel": "Junior Level/Mid Level/Senior Level",
    "jobType": "Full-time/Part-time/Contract/Internship",
    "department": "department if clearly mentioned, otherwise null"
  },
  "requiredSkills": {
    "technical": ["list exact technical skills mentioned"],
    "soft": ["list soft skills mentioned"],
    "certifications": ["specific certifications mentioned"],
    "experience": ["specific experience requirements with years"]
  },
  "applicationTips": {
    "keywords": ["top 8-10 ATS keywords from job description"],
    "importantQualifications": ["3-5 most critical requirements"],
    "preferredExperience": ["3-5 preferred but not required qualifications"],
    "applicationMethod": "how to apply based on job posting instructions"
  }
}

Extract ONLY information that is explicitly mentioned in the job description. Do not infer or add information not present in the text.`;
  }

  private getUserPrompt(prompt: LLMAnalysisPrompt): string {
    let userPrompt = `Analyze this job description:\n\n${prompt.jobDescription}`;

    if (prompt.companyInfo) {
      userPrompt += `\n\nAdditional company information:\n${prompt.companyInfo}`;
    }

    if (prompt.salaryData) {
      userPrompt += `\n\nSalary information:\n${prompt.salaryData}`;
    }

    return userPrompt;
  }

  private async callLLMAPI(systemPrompt: string, userPrompt: string): Promise<any> {
    switch (this.provider) {
      case 'groq':
        return this.callGroq(systemPrompt, userPrompt);
      case 'openai':
        return this.callOpenAI(systemPrompt, userPrompt);
      case 'anthropic':
        return this.callAnthropic(systemPrompt, userPrompt);
      default:
        throw new Error('No LLM API key configured');
    }
  }

  private async callGroq(systemPrompt: string, userPrompt: string): Promise<any> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Fast and efficient Groq model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }, // Ensure JSON response
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  private async callAnthropic(systemPrompt: string, userPrompt: string): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        system: systemPrompt + '\n\nReturn only valid JSON, no other text.',
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  private parseResponse(response: any): Partial<JobAnalysisResult> {
    try {
      let content: string;

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      if (response.choices && response.choices[0]?.message?.content) {
        // OpenAI/Groq response format
        content = response.choices[0].message.content;
      } else if (response.content && response.content[0]?.text) {
        // Anthropic response format
        content = response.content[0].text;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Unexpected response format');
      }

      console.log('LLM Content:', content);

      // Try to parse as JSON directly first
      try {
        return JSON.parse(content);
      } catch (directParseError) {
        // Extract JSON from response (handle potential markdown formatting)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in content:', content);
          throw new Error('No JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Full response:', response);
      // Return mock data as fallback but log the error
      return this.getMockAnalysis('Failed to parse LLM response');
    }
  }

  private getMockAnalysis(jobDescription: string): Partial<JobAnalysisResult> {
    // Enhanced mock analysis with better parsing
    const lines = jobDescription.split('\n').filter(line => line.trim());

    // More sophisticated title extraction
    const titlePatterns = [
      /(?:position|role|job title):\s*(.+)/i,
      /^(.+(?:engineer|developer|manager|analyst|designer|specialist|coordinator))/i,
      /^([A-Z][^.!?]*(?:engineer|developer|manager|analyst|designer|specialist|coordinator)[^.!?]*)/i
    ];

    let extractedTitle = 'Software Engineer';
    for (const pattern of titlePatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        extractedTitle = match[1].trim();
        break;
      }
    }

    // Company extraction
    const companyPatterns = [
      /(?:company|at):\s*(.+)/i,
      /join\s+([A-Z][^.!?\n]*(?:inc|corp|llc|ltd|company))/i,
      /(?:we're|we are)\s+([A-Z][^.!?\n]*)/i
    ];

    let extractedCompany = 'TechCorp';
    for (const pattern of companyPatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        extractedCompany = match[1].trim().replace(/[.,]$/, '');
        break;
      }
    }

    // Enhanced skill extraction
    const skillDatabase = {
      technical: [
        'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js',
        'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
        'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git',
        'Redux', 'GraphQL', 'REST API', 'Microservices', 'CI/CD'
      ],
      soft: [
        'Communication', 'Leadership', 'Problem solving', 'Team collaboration',
        'Project management', 'Critical thinking', 'Adaptability', 'Mentoring',
        'Cross-functional collaboration', 'Stakeholder management'
      ]
    };

    const foundTechnical = skillDatabase.technical.filter(skill =>
      new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi').test(jobDescription)
    );

    const foundSoft = skillDatabase.soft.filter(skill =>
      new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi').test(jobDescription)
    );

    return {
      jobDetails: {
        title: extractedTitle,
        company: extractedCompany,
        location: this.extractLocation(jobDescription),
        experienceLevel: this.extractExperienceLevel(jobDescription),
        jobType: this.extractJobType(jobDescription),
      },
      requiredSkills: {
        technical: foundTechnical.length > 0 ? foundTechnical.slice(0, 8) : ['React', 'TypeScript', 'JavaScript', 'Node.js'],
        soft: foundSoft.length > 0 ? foundSoft.slice(0, 5) : ['Communication', 'Problem solving', 'Team collaboration'],
        certifications: this.extractCertifications(jobDescription),
        experience: this.extractExperienceRequirements(jobDescription),
      },
      applicationTips: {
        keywords: [...foundTechnical.slice(0, 5), ...foundSoft.slice(0, 3)],
        importantQualifications: [
          'Strong technical skills in required technologies',
          'Proven experience in similar roles',
          'Excellent communication and collaboration abilities'
        ],
        preferredExperience: [
          'Experience with mentioned tech stack',
          'Previous work in similar industry',
          'Track record of successful project delivery'
        ],
        applicationMethod: this.extractApplicationMethod(jobDescription),
      },
    };
  }

  private extractLocation(jobDescription: string): string {
    const locationPatterns = [
      /location:\s*(.+)/i,
      /\b(remote|hybrid)\b/i,
      /\b([A-Z][a-z]+,\s*[A-Z]{2})\b/,
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})\b/
    ];

    for (const pattern of locationPatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return 'Remote';
  }

  private extractExperienceLevel(jobDescription: string): string {
    if (/senior|lead|principal|staff/i.test(jobDescription)) return 'Senior Level';
    if (/junior|entry.level|associate/i.test(jobDescription)) return 'Junior Level';
    if (/mid.level|intermediate/i.test(jobDescription)) return 'Mid Level';

    // Check for years of experience
    const yearsMatch = jobDescription.match(/(\d+)\+?\s*years?\s+(?:of\s+)?experience/i);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years >= 5) return 'Senior Level';
      if (years <= 2) return 'Junior Level';
      return 'Mid Level';
    }

    return 'Mid Level';
  }

  private extractJobType(jobDescription: string): string {
    if (/part.time/i.test(jobDescription)) return 'Part-time';
    if (/contract|contractor|freelance/i.test(jobDescription)) return 'Contract';
    if (/internship|intern/i.test(jobDescription)) return 'Internship';
    return 'Full-time';
  }

  private extractCertifications(jobDescription: string): string[] {
    const certPatterns = [
      /AWS\s+Certified/i,
      /Azure\s+Certified/i,
      /Google\s+Cloud\s+Certified/i,
      /PMP/i,
      /Scrum\s+Master/i,
      /CISSP/i,
    ];

    return certPatterns
      .map(pattern => jobDescription.match(pattern)?.[0])
      .filter(Boolean) as string[];
  }

  private extractExperienceRequirements(jobDescription: string): string[] {
    const expPatterns = [
      /\d+\+?\s*years?\s+(?:of\s+)?experience\s+(?:with|in)\s+([^.!?\n]+)/gi,
      /experience\s+(?:with|in)\s+([^.!?\n]+)/gi,
    ];

    const requirements: string[] = [];
    for (const pattern of expPatterns) {
      const matches = [...jobDescription.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && !requirements.includes(match[1].trim())) {
          requirements.push(match[1].trim());
        }
      });
    }

    return requirements.slice(0, 5);
  }

  private extractApplicationMethod(jobDescription: string): string {
    if (/apply\s+(?:at|on|through).+careers/i.test(jobDescription)) {
      return 'Apply through company careers page';
    }
    if (/send.+resume.+to/i.test(jobDescription)) {
      return 'Email resume to provided contact';
    }
    if (/linkedin/i.test(jobDescription)) {
      return 'Apply via LinkedIn or contact recruiter';
    }
    return 'Apply through job posting or company website';
  }
}