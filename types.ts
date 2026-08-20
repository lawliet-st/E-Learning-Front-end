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
  nineBoxPosition: {
    performance: 'Low' | 'Medium' | 'High';
    potential: 'Low' | 'Medium' | 'High';
  };
  assessment: AssessmentScores;
  tags?: string[];
  skillAssessmentScore?: number;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  internalEmail?: string;
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
export type CourseStatus = 'draft' | 'published' | 'closed';

export interface PublishHistoryItem {
  status: CourseStatus;
  timestamp: string;
  operator: string;
}

export interface CompulsoryTargets {
  departments: string[];
  userIds: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string; 
  type: CourseType; 
  status?: CourseStatus; // 'draft' | 'published' | 'closed'
  passScore?: number; // Default 70
  isRandom10?: boolean; // If true, randomly select 10 questions (each 10 pts)
  isRandomOrder?: boolean; // If true, shuffle question order
  isRandomOptions?: boolean; // If true, shuffle options order for each question
  createdAt: string; 
  visualSummary?: string; 
  thumbnail: string;
  videoUrl: string;
  pdfUrl: string;
  duration: string; 
  durationSeconds: number; 
  attributes: CourseAttributes; 
  questions: Question[];
  compulsoryTargets?: CompulsoryTargets;
  publishHistory?: PublishHistoryItem[];
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completed: boolean;
  quizScore: number | null;
  satisfaction?: number; // 1-5
  attemptDate?: string;
  failCount?: number; // Count of failed attempts
  lastAttemptTime?: string; // Timestamp of last failed/completed attempt
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'system' | 'course_auto' | 'notice';
  imageUrl?: string;
  courseId?: string;
  createdAt: string;
  isPinned: boolean;
  author: string;
}

export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export interface TalentMetric {
  userId: string;
  userName: string;
  department: string;
  averageScore: number;
  completedCoursesCount: number;
  isHighPotential: boolean;
  profile: TalentProfileData;
  calculatedPot?: number;
  calculatedPerf?: number;
  internalEmail?: string;
}