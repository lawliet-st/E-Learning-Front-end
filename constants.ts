import { User, Course, CourseProgress } from './types';

const MOCK_HPI_DETAILS = [
  { label: '調適性', score: 85 },
  { label: '抱負', score: 70 },
  { label: '社交性', score: 60 },
  { label: '人際敏感', score: 90 },
  { label: '審慎性', score: 75 },
  { label: '好奇心', score: 80 },
  { label: '學習方式', score: 85 },
];

const MOCK_HDS_DETAILS = [
  { label: '易怒', score: 20 },
  { label: '多疑', score: 30 },
  { label: '謹慎', score: 40 },
  { label: '疏離', score: 25 },
  { label: '消極對抗', score: 35 },
  { label: '自大', score: 50 },
  { label: '狡猾', score: 45 },
  { label: '戲劇化', score: 60 },
  { label: '幻想', score: 55 },
  { label: '固執', score: 30 },
  { label: '依賴', score: 20 },
];

const MOCK_MVPI_DETAILS = [
  { label: '認可', score: 80 },
  { label: '權力', score: 75 },
  { label: '享樂', score: 40 },
  { label: '利他', score: 90 },
  { label: '歸屬', score: 85 },
  { label: '傳統', score: 60 },
  { label: '安全', score: 70 },
  { label: '商業', score: 65 },
  { label: '美感', score: 50 },
  { label: '科學', score: 55 },
];

// Helper to get current month date
const currentMonth = new Date().toISOString().slice(0, 7);

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: '系統管理員',
    email: 'admin@company.com',
    internalEmail: 'admin.internal@shengyu.com',
    role: 'admin',
    department: '人資部',
    title: '人資經理',
    avatar: 'https://picsum.photos/seed/admin/100/100',
    profile: {
      age: 35,
      joinDate: '2018-05-20',
      performanceHistory: [],
      skills: [],
      nineBoxPosition: { performance: 'High', potential: 'High' },
      assessment: { hpi: 0, hds: 0, mvpi: 0, completed: false },
      tags: ['細心', '領導力'],
      skillAssessmentScore: 0
    }
  },
  {
    id: 'u2',
    name: '陳雅婷 (Alice)',
    email: 'alice@company.com',
    internalEmail: 'alice.chen@shengyu.com',
    role: 'employee',
    department: '業務部',
    title: '資深業務代表',
    avatar: 'https://picsum.photos/seed/alice/100/100',
    profile: {
      age: 29,
      joinDate: `${currentMonth}-05`, // New joiner this month simulation
      performanceHistory: [
        { year: '2021', rating: 4.2 },
        { year: '2022', rating: 4.5 },
        { year: '2023', rating: 4.8 },
      ],
      skills: [
        { subject: '業務談判', A: 90, fullMark: 100 },
        { subject: '數據分析', A: 65, fullMark: 100 },
        { subject: '溝通協調', A: 95, fullMark: 100 },
        { subject: '專案管理', A: 70, fullMark: 100 },
        { subject: '領導力', A: 85, fullMark: 100 },
      ],
      nineBoxPosition: { performance: 'High', potential: 'High' }, // Star
      assessment: { 
        hpi: 88, hds: 45, mvpi: 92, completed: true,
        hpiDetails: MOCK_HPI_DETAILS,
        hdsDetails: MOCK_HDS_DETAILS,
        mvpiDetails: MOCK_MVPI_DETAILS,
      },
      tags: ['外向', '開朗', '目標導向', '社交高手'],
      skillAssessmentScore: 42 // Mock score
    }
  },
  {
    id: 'u3',
    name: '林志豪 (Bob)',
    email: 'bob@company.com',
    internalEmail: 'bob.lin@shengyu.com',
    role: 'employee',
    department: '研發部',
    title: '後端工程師',
    avatar: 'https://picsum.photos/seed/bob/100/100',
    profile: {
      age: 32,
      joinDate: '2019-11-01',
      performanceHistory: [
        { year: '2021', rating: 3.8 },
        { year: '2022', rating: 4.0 },
        { year: '2023', rating: 3.9 },
      ],
      skills: [
        { subject: '程式開發', A: 95, fullMark: 100 },
        { subject: '系統架構', A: 80, fullMark: 100 },
        { subject: '溝通協調', A: 50, fullMark: 100 },
        { subject: '專案管理', A: 60, fullMark: 100 },
        { subject: '領導力', A: 40, fullMark: 100 },
      ],
      nineBoxPosition: { performance: 'Medium', potential: 'Medium' }, // Core Player
      assessment: { hpi: 60, hds: 70, mvpi: 55, completed: false },
      tags: ['專注', '邏輯強', '內向'],
      skillAssessmentScore: 35
    }
  },
  {
    id: 'u4',
    name: '張偉銘 (Charlie)',
    email: 'charlie@company.com',
    internalEmail: 'charlie.zhang@shengyu.com',
    role: 'employee',
    department: '行銷部',
    title: '行銷專員',
    avatar: 'https://picsum.photos/seed/charlie/100/100',
    profile: {
      age: 25,
      joinDate: '2023-01-10',
      performanceHistory: [
        { year: '2023', rating: 3.2 },
      ],
      skills: [
        { subject: '社群經營', A: 80, fullMark: 100 },
        { subject: '文案撰寫', A: 75, fullMark: 100 },
        { subject: '數據分析', A: 40, fullMark: 100 },
        { subject: '專案管理', A: 50, fullMark: 100 },
        { subject: '溝通協調', A: 70, fullMark: 100 },
      ],
      nineBoxPosition: { performance: 'Low', potential: 'Medium' }, // Inconsistent Player
      assessment: { hpi: 0, hds: 0, mvpi: 0, completed: false },
      tags: ['創意', '活潑'],
      skillAssessmentScore: 0
    }
  },
  {
    id: 'u5',
    name: '王淑芬 (Diana)',
    email: 'diana@company.com',
    internalEmail: 'diana.wang@shengyu.com',
    role: 'employee',
    department: '研發部',
    title: '資深前端工程師',
    avatar: 'https://picsum.photos/seed/diana/100/100',
    profile: {
      age: 30,
      joinDate: '2021-06-01',
      performanceHistory: [
        { year: '2021', rating: 4.5 },
        { year: '2022', rating: 4.7 },
        { year: '2023', rating: 4.8 },
      ],
      skills: [
        { subject: '前端技術', A: 98, fullMark: 100 },
        { subject: 'UI/UX', A: 90, fullMark: 100 },
        { subject: '溝通協調', A: 85, fullMark: 100 },
        { subject: '專案管理', A: 80, fullMark: 100 },
        { subject: '領導力', A: 75, fullMark: 100 },
      ],
      nineBoxPosition: { performance: 'High', potential: 'High' },
      assessment: { hpi: 85, hds: 30, mvpi: 88, completed: true },
      tags: ['美感', '負責', '團隊合作'],
      skillAssessmentScore: 45
    }
  },
  {
    id: 'u6',
    name: '李家豪 (Evan)',
    email: 'evan@company.com',
    internalEmail: 'evan.lee@shengyu.com',
    role: 'employee',
    department: '業務部',
    title: '業務經理',
    avatar: 'https://picsum.photos/seed/evan/100/100',
    profile: {
      age: 38,
      joinDate: '2015-09-01',
      performanceHistory: [
        { year: '2021', rating: 4.0 },
        { year: '2022', rating: 3.9 },
        { year: '2023', rating: 4.1 },
      ],
      skills: [
        { subject: '業務策略', A: 90, fullMark: 100 },
        { subject: '團隊管理', A: 85, fullMark: 100 },
        { subject: '市場分析', A: 80, fullMark: 100 },
        { subject: '溝通協調', A: 85, fullMark: 100 },
        { subject: '創新思維', A: 60, fullMark: 100 },
      ],
      nineBoxPosition: { performance: 'Medium', potential: 'Medium' },
      assessment: { hpi: 70, hds: 50, mvpi: 70, completed: true },
      tags: ['穩重', '策略型'],
      skillAssessmentScore: 30
    }
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: '職場安全基礎',
    category: '職安衛',
    type: 'compulsory',
    createdAt: `${currentMonth}-02`,
    description: '了解工作環境中的潛在危害與緊急應變措施，確保自身與他人安全。',
    thumbnail: 'https://picsum.photos/seed/safety/400/225',
    videoUrl: 'https://www.youtube.com/embed/AdXq760YyWA',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '45 分鐘',
    durationSeconds: 2700,
    attributes: { logic: 40, professional: 80, difficulty: 30, importance: 100, knowledgeLimit: 20 },
    questions: [
      { id: 'q1', text: '發現火災的第一步是什麼？', options: ['逃跑', '拉響警報', '躲起來'], correctAnswer: 1 },
      { id: 'q2', text: '緊急出口應該設在哪裡？', options: ['隱蔽處', '標示清楚處', '上鎖處'], correctAnswer: 1 },
      { id: 'q3', text: '誰需要負責職場安全？', options: ['只有經理', '每一個人', '沒人'], correctAnswer: 1 },
    ]
  },
  {
    id: 'c2',
    title: '高效溝通技巧',
    category: '軟實力',
    type: 'elective',
    createdAt: '2023-09-15',
    description: '學習如何與團隊成員及客戶進行清晰、有說服力的溝通。',
    thumbnail: 'https://picsum.photos/seed/comm/400/225',
    videoUrl: 'https://www.youtube.com/embed/srn5jgp5QDc',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '1小時 20分',
    durationSeconds: 4800,
    attributes: { logic: 60, professional: 50, difficulty: 40, importance: 90, knowledgeLimit: 30 },
    questions: [
      { id: 'q1', text: '什麼是積極聆聽？', options: ['大聲說話', '全神貫注聽講者', '忽略對方'], correctAnswer: 1 },
      { id: 'q2', text: '非語言溝通包括：', options: ['電子郵件', '肢體語言', '電話'], correctAnswer: 1 },
    ]
  },
  {
    id: 'c3',
    title: '資安與隱私保護',
    category: 'IT技能',
    type: 'compulsory',
    createdAt: `${currentMonth}-10`,
    description: '深入了解 GDPR 與公司內部的資料處理政策，防止資安外洩。',
    thumbnail: 'https://picsum.photos/seed/security/400/225',
    videoUrl: 'https://www.youtube.com/embed/z5nc9MDd-hU',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '50 分鐘',
    durationSeconds: 3000,
    attributes: { logic: 70, professional: 90, difficulty: 60, importance: 100, knowledgeLimit: 60 },
    questions: [
      { id: 'q1', text: '密碼應該設定為：', options: ['共用', '複雜且獨特', '寫在便利貼上'], correctAnswer: 1 },
      { id: 'q2', text: '什麼是網路釣魚 (Phishing)？', options: ['一種運動', '網路攻擊', '一種軟體'], correctAnswer: 1 },
    ]
  },
  {
    id: 'c4',
    title: '卓越領導力 101',
    category: '管理',
    type: 'elective',
    createdAt: '2023-08-20',
    description: '掌握帶領高績效團隊的核心原則與激勵技巧。',
    thumbnail: 'https://picsum.photos/seed/lead/400/225',
    videoUrl: 'https://www.youtube.com/embed/2l-AOBz69KU',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '2 小時',
    durationSeconds: 7200,
    attributes: { logic: 80, professional: 60, difficulty: 75, importance: 95, knowledgeLimit: 50 },
    questions: [
      { id: 'q1', text: '好的領導者應該：', options: ['微觀管理', '授權他人', '避免決策'], correctAnswer: 1 },
    ]
  },
  {
    id: 'c5',
    title: '進階專案管理',
    category: '管理',
    type: 'elective',
    createdAt: '2023-07-05',
    description: '敏捷開發 (Agile) 方法論與時程估算技巧實戰。',
    thumbnail: 'https://picsum.photos/seed/project/400/225',
    videoUrl: 'https://www.youtube.com/embed/MhVwU5h2a_E',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '3 小時',
    durationSeconds: 10800,
    attributes: { logic: 90, professional: 85, difficulty: 80, importance: 80, knowledgeLimit: 75 },
    questions: [
      { id: 'q1', text: 'Scrum 是一種什麼框架？', options: ['敏捷 (Agile)', '瀑布 (Waterfall)', '製造業'], correctAnswer: 0 },
    ]
  },
  {
    id: 'c6',
    title: '數位行銷基礎',
    category: '行銷',
    type: 'elective',
    createdAt: '2023-09-01',
    description: 'SEO、SEM 與社群媒體經營策略入門。',
    thumbnail: 'https://picsum.photos/seed/market/400/225',
    videoUrl: 'https://www.youtube.com/embed/nU-IIXJLjoM',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '1 小時',
    durationSeconds: 3600,
    attributes: { logic: 50, professional: 70, difficulty: 40, importance: 60, knowledgeLimit: 30 },
    questions: [
      { id: 'q1', text: 'SEO 代表什麼？', options: ['搜尋引擎優化', '銷售執行官', '無'], correctAnswer: 0 },
    ]
  }
];

export const MOCK_PROGRESS: CourseProgress[] = [
  // High Potential Candidate: Alice (u2)
  { userId: 'u2', courseId: 'c1', completed: true, quizScore: 90, satisfaction: 5, attemptDate: '2023-10-01' },
  { userId: 'u2', courseId: 'c2', completed: true, quizScore: 85, satisfaction: 4, attemptDate: '2023-10-02' },
  { userId: 'u2', courseId: 'c3', completed: true, quizScore: 100, satisfaction: 5, attemptDate: '2023-10-03' },
  { userId: 'u2', courseId: 'c4', completed: true, quizScore: 95, satisfaction: 5, attemptDate: '2023-10-05' },
  { userId: 'u2', courseId: 'c5', completed: true, quizScore: 80, satisfaction: 4, attemptDate: '2023-10-06' },
  { userId: 'u2', courseId: 'c6', completed: true, quizScore: 90, satisfaction: 5, attemptDate: '2023-10-07' },

  // Average Employee: Bob (u3)
  { userId: 'u3', courseId: 'c1', completed: true, quizScore: 70, satisfaction: 3, attemptDate: '2023-10-01' },
  { userId: 'u3', courseId: 'c2', completed: true, quizScore: 65, satisfaction: 4, attemptDate: '2023-10-04' },
  
  // Struggling Employee: Charlie (u4)
  { userId: 'u4', courseId: 'c1', completed: true, quizScore: 50, satisfaction: 2, attemptDate: '2023-10-01' }, 
  { userId: 'u4', courseId: 'c2', completed: false, quizScore: null, attemptDate: undefined },

  // Diana (u5)
  { userId: 'u5', courseId: 'c1', completed: true, quizScore: 100, satisfaction: 5, attemptDate: '2023-10-01' },
  { userId: 'u5', courseId: 'c2', completed: true, quizScore: 100, satisfaction: 5, attemptDate: '2023-10-02' },
  { userId: 'u5', courseId: 'c3', completed: true, quizScore: 90, satisfaction: 4, attemptDate: '2023-10-03' },
  { userId: 'u5', courseId: 'c4', completed: true, quizScore: 95, satisfaction: 5, attemptDate: '2023-10-04' },
  { userId: 'u5', courseId: 'c5', completed: true, quizScore: 95, satisfaction: 5, attemptDate: '2023-10-05' },
  { userId: 'u5', courseId: 'c6', completed: true, quizScore: 85, satisfaction: 4, attemptDate: '2023-10-06' },
];