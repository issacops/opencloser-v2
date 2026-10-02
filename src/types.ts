export type LeadStatus = "Discovery" | "Outbound Call" | "Audit Requested" | "Closed";

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  title?: string;
  linkedin_url?: string;
  notes?: string;
  status: LeadStatus;
  score: number;
  created_at: string;
}

export interface ICP {
  targetAudience: string;
  industry: string;
  companySize: string;
  decisionMakerTitles: string[];
  painPoints: string[];
  objections: string[];
  competitorNames: string[];
  valueProposition: string;
  salesMethodology:
    "SPIN Selling" | "Challenger Sale" | "Sandler System" | "Straight Line Persuasion";
  systemPrompt: string;
}
