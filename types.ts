export type Role = 'admin' | 'employee';

export interface HoganDimension {
  label: string;
  score: number;
  description?: string;
}

export interface AssessmentScores {
  hpi: number; 
  hds: number; 
  mvpi: number; 
  // Detailed dimensions
  hpiDetails?: HoganDimension[];
  hdsDetails?: HoganDimension[];
  mvpiDetails?: HoganDimension[];
  completed: boolean;
}

export interface Skill {
  subject: string;
  A: number; // Score
  fullMark: number;
}

export interface PerformanceRecord {
  year: string;
  rating: number; // 1-5
}

export interface TalentProfileData {
  age: number;
  joinDate: string;
  performanceHistory: PerformanceRecord[];
  skills: Skill[];
  // Calculated dynamically now, but kept for legacy mock structure or manual override
  nineBoxPosition: {
    performance: 'Low' | 'Medium' | 'High';
    potential: 'Low' | 'Medium' | 'High';
  };
  assessment: AssessmentScores;
  tags: string[]; // New: User tags
  skillAssessmentScore?: number; // New: 0-50
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  internalEmail?: string; // New: Internal Email
  role: Role;
  avatar: string;
  department: string;
  title: string;
  profile: TalentProfileData;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface CourseAttributes {
  logic: number;
  professional: number;
  difficulty: number;
  importance: number;
  knowledgeLimit: number;
}

export type CourseType = 'compulsory' | 'elective';

export interface CompulsoryTargets {
  departments: string[];
  userIds: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string; 
  type: CourseType; // New: Elective vs Compulsory/Recommended
  createdAt: string; // New: For monthly stats
  visualSummary?: string; // New: SVG string from GenAI
  thumbnail: string;
  videoUrl: string;
  pdfUrl: string;
  duration: string; 
  durationSeconds: number; 
  attributes: CourseAttributes; 
  questions: Question[];
  compulsoryTargets?: CompulsoryTargets;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completed: boolean;
  quizScore: number | null;
  satisfaction?: number; // New: 1-5
  attemptDate?: string;
}

export interface TalentMetric {
  userId: string;
  userName: string;
  department: string;
  averageScore: number;
  completedCoursesCount: number;
  isHighPotential: boolean;
  profile: TalentProfileData;
  calculatedPot?: number; // Internal use
  calculatedPerf?: number; // Internal use
  internalEmail?: string;
}