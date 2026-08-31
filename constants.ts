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
    employeeId: 'admin001',
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
      tags: [],
      skillAssessmentScore: 0
    }
  },
  {
    id: 'u2',
    employeeId: 'E10001',
    name: '陳雅婷 (Alice)',
    email: 'alice@company.com',
    internalEmail: 'alice.chen@shengyu.com',
    role: 'employee',
    department: '業務部',
    title: '資深業務代表',
    avatar: 'https://picsum.photos/seed/alice/100/100',
    profile: {
      age: 29,
      joinDate: `${currentMonth}-05`,
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
      nineBoxPosition: { performance: 'High', potential: 'High' },
      assessment: { 
        hpi: 88, hds: 45, mvpi: 92, completed: true,
        hpiDetails: MOCK_HPI_DETAILS,
        hdsDetails: MOCK_HDS_DETAILS,
        mvpiDetails: MOCK_MVPI_DETAILS,
      },
      tags: [],
      skillAssessmentScore: 42
    }
  },
  {
    id: 'u3',
    employeeId: 'E10002',
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
      nineBoxPosition: { performance: 'Medium', potential: 'Medium' },
      assessment: { hpi: 60, hds: 70, mvpi: 55, completed: false },
      tags: [],
      skillAssessmentScore: 35
    }
  },
  {
    id: 'u4',
    employeeId: 'E10003',
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
      nineBoxPosition: { performance: 'Low', potential: 'Medium' },
      assessment: { hpi: 0, hds: 0, mvpi: 0, completed: false },
      tags: [],
      skillAssessmentScore: 0
    }
  },
  {
    id: 'u5',
    employeeId: 'E10004',
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
      tags: [],
      skillAssessmentScore: 45
    }
  },
  {
    id: 'u6',
    employeeId: 'E10005',
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
      tags: [],
      skillAssessmentScore: 30
    }
  }
];

export const MOCK_CATEGORIES = [
  { id: 1, name: '職安衛', createdAt: '2024-01-01' },
  { id: 2, name: '軟實力', createdAt: '2024-01-01' },
  { id: 3, name: 'IT技能', createdAt: '2024-01-01' },
  { id: 4, name: '管理', createdAt: '2024-01-01' },
  { id: 5, name: '行銷', createdAt: '2024-01-01' },
  { id: 6, name: '品質管理', createdAt: '2024-01-01' },
  { id: 7, name: '生產製造', createdAt: '2024-01-01' },
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    title: '【盛餘HRD領航者】歡迎使用盛餘數位學習平台',
    content: '全方位內部培訓平台正式上線，提供各領域專業內訓課程、影音學習與線上測驗，歡迎同仁踴躍進修！',
    type: 'system' as const,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    createdAt: '2024-01-01 09:00',
    isPinned: true,
    author: '系統管理員'
  },
  {
    id: 2,
    title: '📢 【新課上架】職安衛領域《職場安全基礎》已正式開課！',
    content: '職場安全基礎包含工作危害防範與緊急應變，請全體同仁於指定時限內完成修習並通過測驗。',
    type: 'course_auto' as const,
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    courseId: 'c1',
    createdAt: '2024-01-02 10:00',
    isPinned: false,
    author: '人資部'
  },
  {
    id: 3,
    title: '📢 【新課上架】IT技能領域《資安與隱私保護》已開放選讀',
    content: '資安意識人人有責，課程內容包含 GDPR 與公司最新機密資料處理防範政策，請儘速修習。',
    type: 'course_auto' as const,
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    courseId: 'c3',
    createdAt: '2024-01-05 14:00',
    isPinned: false,
    author: '資訊處'
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: '職場安全基礎',
    category: '職安衛',
    type: 'compulsory',
    status: 'published',
    passScore: 70,
    isRandom10: true,
    isRandomOrder: false,
    createdAt: `${currentMonth}-02`,
    description: '了解工作環境中的潛在危害與緊急應變措施，確保自身與他人安全。',
    thumbnail: 'https://picsum.photos/seed/safety/400/225',
    videoUrl: 'https://www.youtube.com/embed/AdXq760YyWA',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '45 分鐘',
    durationSeconds: 2700,
    attributes: { logic: 40, professional: 80, difficulty: 30, importance: 100, knowledgeLimit: 20 },
    questions: [
      { id: 'q1', text: '發現火災的第一步是什麼？', options: ['立即逃跑不管他人', '拉響警報並通報', '躲進辦公桌底下', '繼續工作'], correctAnswer: 1 },
      { id: 'q2', text: '緊急逃生出口應該保持何種狀態？', options: ['堆放雜物以防外人進入', '標示清楚且暢通無阻', '隨時上鎖保護財產', '拉下鐵捲門'], correctAnswer: 1 },
      { id: 'q3', text: '進入工廠生產作業區時，同仁應配戴何種基本個人防護裝備？', options: ['標準安全帽與防護鞋', '一般休閒帽', '耳機聽音樂', '無需佩戴'], correctAnswer: 0 },
      { id: 'q4', text: '若在廠區發現化學品洩漏，首要處置方式為何？', options: ['立即徒手清理', '遠離現場並通知工安單位處理', '用水直接沖洗', '裝作沒看見'], correctAnswer: 1 },
      { id: 'q5', text: '滅火器使用口訣『拉、瞄、壓、掃』中，『拉』是指拉開什麼？', options: ['拉開安全插銷', '拉開水管', '拉開門窗', '拉開警報器'], correctAnswer: 0 },
      { id: 'q6', text: '高處作業（超過 2 公尺）必須確實使用下列何項防護設施？', options: ['安全帶與防墜設施', '普通梯子即可', '厚底鞋', '手套'], correctAnswer: 0 },
      { id: 'q7', text: '發生職業災害時，當班人員應於多少時限內通報主管與工安課？', options: ['下個月底前', '立即第一時間通報', '3天內', '無需通報'], correctAnswer: 1 },
      { id: 'q8', text: '對於用電安全，以下何者為錯誤行為？', options: ['插座過載使用多孔插頭', '定期檢查電線絕緣', '手部潮濕不碰開關', '損壞電線立即更換'], correctAnswer: 0 },
      { id: 'q9', text: '職業安全衛生政策的核心精神是？', options: ['零災害與全員參與', '產量優先於安全', '只要應付法規檢查', '僅由工安人員負責'], correctAnswer: 0 },
      { id: 'q10', text: '遇到地震時，室內人員的避難三步驟為？', options: ['趴下、掩護、穩住', '快跑、大叫、跳樓', '搭乘電梯逃生', '站立於窗戶邊'], correctAnswer: 0 },
    ]
  },
  {
    id: 'c2',
    title: '高效溝通技巧',
    category: '軟實力',
    type: 'elective',
    status: 'published',
    passScore: 70,
    isRandom10: true,
    isRandomOrder: false,
    createdAt: '2023-09-15',
    description: '學習如何與團隊成員及客戶進行清晰、有說服力的溝通。',
    thumbnail: 'https://picsum.photos/seed/comm/400/225',
    videoUrl: 'https://www.youtube.com/embed/srn5jgp5QDc',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '1小時 20分',
    durationSeconds: 4800,
    attributes: { logic: 60, professional: 50, difficulty: 40, importance: 90, knowledgeLimit: 30 },
    questions: [
      { id: 'q1', text: '什麼是高效溝通中的『積極聆聽』？', options: ['隨時準備打斷對方陳述自己的意見', '全神貫注理解說話者的立場與本意', '邊聽邊滑手機處理其他事務', '大聲覆誦對方的每句話'], correctAnswer: 1 },
      { id: 'q2', text: '非語言溝通（肢體語言、眼神與語調）在溝通成效中扮演何種角色？', options: ['完全沒有影響', '佔據傳達訊息的極高比例與情緒感受', '只在演講時有用', '比文字更不重要'], correctAnswer: 1 },
      { id: 'q3', text: '跨部門溝通協商時，最能達成雙贏的最佳策略是？', options: ['以同理心出發，透過客觀數據共同探討解決方案', '堅持己見並施壓對方配合', '拒絕對話', '一律交由最高主管裁決'], correctAnswer: 0 },
      { id: 'q4', text: '給予同事建設性回饋 (Feedback) 的原則應為？', options: ['對事不對人，具體且提出可行建議', '公開場合進行人身攻擊', '模糊不清以避免衝突', '只批評不給建議'], correctAnswer: 0 },
      { id: 'q5', text: '在撰寫商務電子郵件時，主旨 (Subject) 應該如何呈現？', options: ['簡潔明確表達郵件核心目的', '留白或只寫『您好』', '寫滿 100 字細節', '只填寫急件二字'], correctAnswer: 0 },
      { id: 'q6', text: '當與客戶或主管發生意見分歧時，第一步應該？', options: ['確認彼此對於目標與事實認知是否一致', '立即反駁對方的論點', '私下抱怨', '直接放棄爭取'], correctAnswer: 0 },
      { id: 'q7', text: '會議溝通中，『會議結論與待辦事項 (Action Items)』的重要性在於？', options: ['明確分工、責任歸屬與完成期限', '單純填寫會議紀錄交差', '沒有實際用途', '僅供主管審閱'], correctAnswer: 0 },
      { id: 'q8', text: '溝通漏斗理論指出，『心裡想講的』到『對方實際執行的』往往會遞減，改善之道為？', options: ['雙向確認 (Check-in) 與定時對焦', '講一次就不再過問', '用更複雜的術語說明', '只用口頭交代不用文字'], correctAnswer: 0 },
      { id: 'q9', text: '在團隊中表達不同觀點時，如何營造『心理安全感』？', options: ['接納多元觀點，鼓勵發問與理性討論', '嚴懲提出反對意見的人', '禁止任何質疑', '只聽資深同仁的意見'], correctAnswer: 0 },
      { id: 'q10', text: '向上溝通（對主管匯報）時，最佳的報告結構為？', options: ['結論先行 (Bottom Line First)，再陳述支持理由與具體行動', '從背景故事漫談，最後才講結論', '只報喜不報憂', '隱瞞問題直到無法收拾'], correctAnswer: 0 },
    ]
  },
  {
    id: 'c3',
    title: '資安與隱私保護',
    category: 'IT技能',
    type: 'compulsory',
    status: 'published',
    passScore: 70,
    isRandom10: true,
    isRandomOrder: false,
    createdAt: `${currentMonth}-10`,
    description: '深入了解 GDPR 與公司內部的資料處理政策，防止資安外洩。',
    thumbnail: 'https://picsum.photos/seed/security/400/225',
    videoUrl: 'https://www.youtube.com/embed/z5nc9MDd-hU',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '50 分鐘',
    durationSeconds: 3000,
    attributes: { logic: 70, professional: 90, difficulty: 60, importance: 100, knowledgeLimit: 60 },
    questions: [
      { id: 'q1', text: '企業員工密碼的最佳設定實務為？', options: ['全公司共用同一密碼', '長度至少 12 碼且包含大小寫英數字與特殊符號', '寫在便利貼貼於螢幕下方', '使用個人生日'], correctAnswer: 1 },
      { id: 'q2', text: '收到主旨為「緊急！您的帳號即將被停用，請點此連結登入」的信件，最可能是？', options: ['公司福利通知', '網路釣魚 (Phishing) 社交工程攻擊', '系統自動更新信', '合作夥伴邀請'], correctAnswer: 1 },
      { id: 'q3', text: '離開辦公座位時，最基本的電腦資安習慣是？', options: ['鎖定電腦螢幕 (Win + L)', '保持螢幕長亮', '將隨身碟插在主機上', '關閉螢幕電源但不鎖定系統'], correctAnswer: 0 },
      { id: 'q4', text: '在公司電腦使用未經 IT 部門核可的個人 USB 隨身碟，其主要資安風險為何？', options: ['隨身碟容易損壞', '可能引入惡意軟體或導致機密資料外洩', '會消耗更多電力', '傳輸速度變慢'], correctAnswer: 1 },
      { id: 'q5', text: '關於勒索軟體 (Ransomware) 的防範，以下何者最為關鍵？', options: ['定期離線備份重要資料並安裝最新資安補丁', '收到可疑附件立即點擊打開確認', '關閉所有防毒軟體以提升電腦速度', '將密碼設為123456'], correctAnswer: 0 },
      { id: 'q6', text: '若不慎點擊可疑釣魚連結或發現電腦出現勒索視窗，第一時間應？', options: ['拔除網路線並立即通報 IT 資安單位', '重啟電腦並裝作沒事', '自行上網下載不明破解軟體', '轉寄給所有同事看'], correctAnswer: 0 },
      { id: 'q7', text: '雙因素驗證 (2FA / MFA) 的核心防護價值在於？', options: ['即使密碼外洩，攻擊者仍因缺少第二道驗證而無法登入', '讓登入流程變繁瑣', '純粹應付法規', '取代密碼不需要設密碼'], correctAnswer: 0 },
      { id: 'q8', text: '處理包含客戶個資或機密營運數據的文件時，傳送前應？', options: ['進行密碼加密壓縮並透過不同管道交付密碼', '直接上傳至公開雲端硬碟分享', '隨意列印丟棄在公共垃圾桶', '貼在社群媒體'], correctAnswer: 0 },
      { id: 'q9', text: '使用公共場所 (如咖啡廳、機場) 的免費 Wi-Fi 時，應避免？', options: ['傳輸機密商務資料或登入未加密內部系統', '使用 VPN 連線', '瀏覽公開新聞網站', '開啟防火牆'], correctAnswer: 0 },
      { id: 'q10', text: '對於廢棄含有公司資料的紙本文件，正確的處理方式為？', options: ['使用碎紙機徹底銷毀', '直接丟入一般垃圾桶', '翻面當計算紙帶回家', '摺紙飛機'], correctAnswer: 0 },
    ]
  },
  {
    id: 'c4',
    title: '卓越領導力 101',
    category: '管理',
    type: 'elective',
    status: 'published',
    passScore: 70,
    isRandom10: true,
    isRandomOrder: false,
    createdAt: '2023-08-20',
    description: '掌握帶領高績效團隊的核心原則與激勵技巧。',
    thumbnail: 'https://picsum.photos/seed/lead/400/225',
    videoUrl: 'https://www.youtube.com/embed/2l-AOBz69KU',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '2 小時',
    durationSeconds: 7200,
    attributes: { logic: 80, professional: 60, difficulty: 75, importance: 95, knowledgeLimit: 50 },
    questions: [
      { id: 'q1', text: '卓越主管在團隊管理中最關鍵的職責是？', options: ['事必躬親進行微觀管理 (Micromanagement)', '賦能同仁、明確願景目標並排除障礙', '避免做出任何重大決策', '獨攬所有功勞'], correctAnswer: 1 },
      { id: 'q2', text: 'SMART 原則中的『M』代表何種目標設定屬性？', options: ['可衡量的 (Measurable)', '奇蹟般的 (Miraculous)', '短期的 (Monthly)', '具同情心的 (Merciful)'], correctAnswer: 0 },
      { id: 'q3', text: '情境領導理論 (Situational Leadership) 主張主管應？', options: ['對所有同仁一律採用相同的高壓管理方式', '依部屬的成熟度與任務能力彈性調整領導風格', '完全放任不管', '只指揮不支援'], correctAnswer: 1 },
      { id: 'q4', text: '激勵理論中，屬於內在動機 (Intrinsic Motivation) 的因素為？', options: ['工作成就感與自主性', '年終獎金', '辦公室零食', '打卡獎勵'], correctAnswer: 0 },
      { id: 'q5', text: '在團隊面臨跨部門衝突時，主管最佳的處理角色是？', options: ['作為協調者引導聚焦於共同目標', '選邊站並攻擊另一部門', '視而不見', '懲處所有發生爭執的同仁'], correctAnswer: 0 },
      { id: 'q6', text: '進行有效授權 (Delegation) 的第一步是？', options: ['清晰界定期望成果、權限範圍與檢核點', '只把最繁重枯燥的工作丟給下屬', '不給任何資源卻要求即刻完成', '隨時插手干預執行細節'], correctAnswer: 0 },
      { id: 'q7', text: '當團隊遭遇重大挫折時，領導者應展現的核心特質是？', options: ['當責與心理韌性 (Resilience)', '公開指責犯錯的基層員工', '立即辭職以示負責', '對外隱瞞失敗事實'], correctAnswer: 0 },
      { id: 'q8', text: '定期進行一對一面談 (1-on-1) 的主要目的在於？', options: ['關心同仁發展、雙向回饋並建立信任', '單純考核考勤紀錄', '向同仁宣洩主管自身情緒', '代替每週例會報告進度'], correctAnswer: 0 },
      { id: 'q9', text: '僕人式領導 (Servant Leadership) 的核心精神是？', options: ['服務團隊，協助部屬成長以共同成就組織目標', '主管親自擔任基層勞動工', '放棄主管決策權', '討好每一位員工'], correctAnswer: 0 },
      { id: 'q10', text: '建立團隊高績效文化的關鍵基石是？', options: ['相互信任、清楚的目標與持續學習回饋機制', '內部惡性競爭', '冗長的會議與頻繁的書面報告', '嚴苛的處罰條例'], correctAnswer: 0 },
    ]
  },
  {
    id: 'c5',
    title: '進階專案管理',
    category: '管理',
    type: 'elective',
    status: 'published',
    passScore: 70,
    isRandom10: true,
    isRandomOrder: false,
    createdAt: '2023-07-05',
    description: '敏捷開發 (Agile) 方法論與時程估算技巧實戰。',
    thumbnail: 'https://picsum.photos/seed/project/400/225',
    videoUrl: 'https://www.youtube.com/embed/MhVwU5h2a_E',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '3 小時',
    durationSeconds: 10800,
    attributes: { logic: 90, professional: 85, difficulty: 80, importance: 80, knowledgeLimit: 75 },
    questions: [
      { id: 'q1', text: '敏捷開發框架 (Agile / Scrum) 的核心價值在於？', options: ['快速迭代、頻繁交付價值與擁抱變更', '嚴格遵守兩年前制定的固定合約', '完全不寫任何文件與測試', '消除所有跨職能協作'], correctAnswer: 0 },
      { id: 'q2', text: '專案管理黃金三角 (Triple Constraint) 是指哪三者之間的平衡？', options: ['範疇 (Scope)、時間 (Time)、成本 (Cost)', '人員、設備、薪資', '計畫、執行、結案', '行銷、研發、人資'], correctAnswer: 0 },
      { id: 'q3', text: '甘特圖 (Gantt Chart) 在專案排程中的主要優勢為？', options: ['直觀視覺化呈現任務時序與關鍵路徑相依性', '取代所有溝通會議', '自動撰寫程式碼', '保證專案絕對不延遲'], correctAnswer: 0 },
      { id: 'q4', text: '專案風險管理的第一步是？', options: ['風險辨識 (Risk Identification)', '風險接受', '支付保險金', '風險推諉'], correctAnswer: 0 },
      { id: 'q5', text: '每日站立會議 (Daily Standup) 的時間通常控制在？', options: ['15 分鐘以內', '2 小時以上', '整天持續進行', '45 分鐘'], correctAnswer: 0 },
      { id: 'q6', text: '什麼是範疇蔓延 (Scope Creep)？', options: ['未經正式變更流程而逐漸增加的專案需求與功能', '專案範疇自然縮減', '團隊規模擴大', '專案預算增加'], correctAnswer: 0 },
      { id: 'q7', text: '關鍵路徑法 (Critical Path Method, CPM) 的關鍵路徑是指？', options: ['決定專案總工期之最長任務序列（浮時為零）', '耗費資金最多的一條路徑', '技術難度最低的一條路徑', '指派人數最多的一條路徑'], correctAnswer: 0 },
      { id: 'q8', text: '專案回顧會議 (Retrospective) 最核心的提問是？', options: ['哪些做得好、哪些可改善、後續如何調整行動', '這次專案誰該為失敗負全責', '預算還剩下多少可以聚餐', '下一個專案何時開始'], correctAnswer: 0 },
      { id: 'q9', text: '工作分解結構 (WBS, Work Breakdown Structure) 的主要作用是？', options: ['將專案可交付成果逐層分解為可管理的工作包', '記錄團隊每日工時', '計算員工績效考核', '製作行銷簡報'], correctAnswer: 0 },
      { id: 'q10', text: '利害關係人 (Stakeholder) 管理的關鍵在於？', options: ['及早辨識期望、主動溝通對焦並管理需求衝突', '隱瞞專案真實進度直到上線', '拒絕所有外部意見', '只聽取投資人的想法'], correctAnswer: 0 },
    ]
  },
  {
    id: 'c6',
    title: '數位行銷基礎',
    category: '行銷',
    type: 'elective',
    status: 'published',
    passScore: 70,
    isRandom10: true,
    isRandomOrder: false,
    createdAt: '2023-09-01',
    description: 'SEO、SEM 與社群媒體經營策略入門。',
    thumbnail: 'https://picsum.photos/seed/market/400/225',
    videoUrl: 'https://www.youtube.com/embed/nU-IIXJLjoM',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration: '1 小時',
    durationSeconds: 3600,
    attributes: { logic: 50, professional: 70, difficulty: 40, importance: 60, knowledgeLimit: 30 },
    questions: [
      { id: 'q1', text: 'SEO (Search Engine Optimization) 的中文定義為？', options: ['搜尋引擎最佳化', '社群行銷營運', '軟體工程師組織', '系統執行官'], correctAnswer: 0 },
      { id: 'q2', text: 'SEM (Search Engine Marketing) 與 SEO 的最大差異在於？', options: ['SEM 包含付費搜尋廣告 (PPC)，SEO 主要著重自然搜尋排名', 'SEO 需要付費給 Google，SEM 完全免費', '兩者完全無關', 'SEM 只適用於傳統報紙廣告'], correctAnswer: 0 },
      { id: 'q3', text: '衡量行銷活動投資效益的指標 ROI 計算公式為？', options: ['(獲利 - 成本) / 成本 * 100%', '點擊次數 / 曝光次數', '總銷售額 * 100', '總成本 / 總利潤'], correctAnswer: 0 },
      { id: 'q4', text: '點閱率 (CTR, Click-Through Rate) 的計算公式為？', options: ['點擊次數 / 曝光次數 * 100%', '轉換次數 / 點擊次數 * 100%', '總瀏覽量 / 網站總頁數', '廣告費用 / 點擊次數'], correctAnswer: 0 },
      { id: 'q5', text: '在社群內容行銷中，提高受眾互動率 (Engagement) 最有效的作法是？', options: ['提供實用價值、引發情感共鳴與設計互動式提問', '每日發布大量廣告推銷硬廣', '只發文字完全不配圖', '關閉留言評論功能'], correctAnswer: 0 },
      { id: 'q6', text: '何謂 A/B 測試 (A/B Testing)？', options: ['針對同一頁面或廣告設計兩種變體，隨機展示給受眾以驗證最佳成效', '先發布 A 版本，一年後再發布 B 版本', '同時經營兩個完全不同的品牌', '只讓內部員工測試'], correctAnswer: 0 },
      { id: 'q7', text: '顧客旅程漏斗 (Marketing Funnel) 的一般流向為？', options: ['認知 (Awareness) -> 考慮 (Consideration) -> 轉換 (Conversion) -> 忠誠 (Loyalty)', '直接購買 -> 認識品牌', '忠誠 -> 離開', '退款 -> 購買'], correctAnswer: 0 },
      { id: 'q8', text: 'EDM (電子郵件行銷) 提高開信率 (Open Rate) 的關鍵因素是？', options: ['具吸引力且相關性高的郵件主旨 (Subject Line)', '使用全大寫英文字母轟炸', '隨機發送給未授權的名單', '附件塞滿 50MB 檔案'], correctAnswer: 0 },
      { id: 'q9', text: '何謂再行銷 (Retargeting)？', options: ['針對曾造訪網站或產生互動之潛在受眾再次遞送精準廣告', '隨機向全球大眾廣撒廣告', '打電話給退貨的顧客', '舉辦實體街頭特賣會'], correctAnswer: 0 },
      { id: 'q10', text: '在 Google Analytics 4 (GA4) 中，使用者在網站上的行為是以何種模型為基礎？', options: ['事件 (Events) 模型', '單純網頁瀏覽 (Pageviews)', '訪客年齡', '僅限電子商務訂單'], correctAnswer: 0 },
    ]
  }
];

export const MOCK_PROGRESS: CourseProgress[] = [
  // High Potential Candidate: Alice (u2)
  { userId: 'u2', courseId: 'c1', completed: true, quizScore: 90, satisfaction: 5, attemptDate: '2024-01-10 14:30:00', failCount: 0 },
  { userId: 'u2', courseId: 'c2', completed: true, quizScore: 85, satisfaction: 4, attemptDate: '2024-01-12 11:20:00', failCount: 0 },
  { userId: 'u2', courseId: 'c3', completed: true, quizScore: 100, satisfaction: 5, attemptDate: '2024-01-15 16:40:00', failCount: 0 },
  { userId: 'u2', courseId: 'c4', completed: true, quizScore: 95, satisfaction: 5, attemptDate: '2024-01-18 09:10:00', failCount: 0 },
  { userId: 'u2', courseId: 'c5', completed: true, quizScore: 80, satisfaction: 4, attemptDate: '2024-01-20 15:50:00', failCount: 0 },
  { userId: 'u2', courseId: 'c6', completed: true, quizScore: 90, satisfaction: 5, attemptDate: '2024-01-22 13:00:00', failCount: 0 },

  // Bob (u3)
  { userId: 'u3', courseId: 'c1', completed: true, quizScore: 70, satisfaction: 3, attemptDate: '2024-01-08 10:00:00', failCount: 1 },
  { userId: 'u3', courseId: 'c2', completed: false, quizScore: 65, satisfaction: 4, attemptDate: '2024-01-14 17:30:00', failCount: 1 },
  
  // Charlie (u4)
  { userId: 'u4', courseId: 'c1', completed: false, quizScore: 50, satisfaction: 2, attemptDate: '2024-01-10 09:00:00', failCount: 2 }, 
  { userId: 'u4', courseId: 'c2', completed: false, quizScore: null, attemptDate: undefined, failCount: 0 },

  // Diana (u5)
  { userId: 'u5', courseId: 'c1', completed: true, quizScore: 100, satisfaction: 5, attemptDate: '2024-01-05 08:30:00', failCount: 0 },
  { userId: 'u5', courseId: 'c2', completed: true, quizScore: 100, satisfaction: 5, attemptDate: '2024-01-07 14:00:00', failCount: 0 },
  { userId: 'u5', courseId: 'c3', completed: true, quizScore: 90, satisfaction: 4, attemptDate: '2024-01-11 10:15:00', failCount: 0 },
  { userId: 'u5', courseId: 'c4', completed: true, quizScore: 95, satisfaction: 5, attemptDate: '2024-01-16 11:45:00', failCount: 0 },
  { userId: 'u5', courseId: 'c5', completed: true, quizScore: 95, satisfaction: 5, attemptDate: '2024-01-19 16:20:00', failCount: 0 },
  { userId: 'u5', courseId: 'c6', completed: true, quizScore: 85, satisfaction: 4, attemptDate: '2024-01-25 15:10:00', failCount: 0 },
];