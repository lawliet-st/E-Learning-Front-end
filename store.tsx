import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Course, CourseProgress, TalentMetric, AssessmentScores, Announcement, Category, CourseStatus } from './types';
import { MOCK_USERS, MOCK_COURSES, MOCK_PROGRESS, MOCK_CATEGORIES, MOCK_ANNOUNCEMENTS } from './constants';

interface DashboardStats {
  newCoursesThisMonth: number;
  newQuizzesThisMonth: number;
  newEmployeesThisMonth: number;
}

export interface QuizCooldownInfo {
  inCooldown: boolean;
  remainingSeconds: number;
  failCount: number;
  cooldownTotalMinutes: number;
}

interface StoreContextType {
  // Auth
  user: User | null;
  login: (employeeId: string, psw: string) => Promise<void>;
  logout: () => void;
  
  // Data
  courses: Course[];
  progress: CourseProgress[];
  allUsers: User[];
  categories: Category[];
  announcements: Announcement[];
  
  // Actions
  submitQuiz: (courseId: string, score: number, satisfaction: number) => Promise<{ passed: boolean; failCount: number }>;
  completeAssessment: (scores: AssessmentScores) => void;
  submitSkillAssessment: (score: number) => void;
  
  // Admin Actions
  addCourse: (course: Course) => Promise<Course | undefined>;
  updateCourse: (course: Course) => Promise<Course | undefined>;
  deleteCourse: (id: string) => Promise<void>;
  duplicateCourse: (id: string) => Promise<Course | undefined>;
  setCourseStatus: (id: string, status: CourseStatus) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Category Actions
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // Announcement Actions
  addAnnouncement: (data: Partial<Announcement>) => Promise<void>;
  updateAnnouncement: (id: number, data: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: number) => Promise<void>;

  // Getters
  getCourseProgress: (courseId: string) => CourseProgress | undefined;
  getQuizCooldownStatus: (courseId: string) => QuizCooldownInfo;
  getAllUserMetrics: () => TalentMetric[];
  getUserById: (id: string) => User | undefined;
  getDashboardStats: () => DashboardStats;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [progress, setProgress] = useState<CourseProgress[]>(MOCK_PROGRESS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

  const fetchInitialData = useCallback(async (token: string) => {
      try {
          const headers = { 'Authorization': `Bearer ${token}` };
          const [uRes, cRes, pRes, catRes, annRes] = await Promise.all([
             fetch('/api/users', {headers}),
             fetch('/api/courses', {headers}),
             fetch('/api/progress', {headers}),
             fetch('/api/categories', {headers}),
             fetch('/api/announcements', {headers})
          ]);
          if (uRes.ok) setAllUsers(await uRes.json());
          if (cRes.ok) setCourses(await cRes.json());
          if (pRes.ok) setProgress(await pRes.json());
          if (catRes.ok) setCategories(await catRes.json());
          if (annRes.ok) setAnnouncements(await annRes.json());
      } catch(e) {
          console.error("Failed to fetch initial data", e);
      }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const rawUserStr = localStorage.getItem('nexus_user');
    const token = localStorage.getItem('nexus_token');
    if (rawUserStr && token) {
        setUser(JSON.parse(rawUserStr));
        fetchInitialData(token);
    }
  }, [fetchInitialData]);

  const login = async (employeeId: string, psw: string) => {
    let res: Response;
    try {
      res = await fetch('/api/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ employee_id: employeeId, password: psw })
      });
    } catch (err: any) {
      throw new Error(`無法連線至 API 伺服器，請確認網路連線或後端服務是否已啟動。(${err.message || err})`);
    }
    
    let data: any;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(`伺服器傳回非 JSON 回應 (HTTP ${res.status}): ${text.substring(0, 100)}... 請確認後端 FastAPI 服務 (Port 8000) 是否已正常啟動與代理設定。`);
    }

    if (!res.ok) {
        throw new Error(data.detail || '登入失敗');
    }

    localStorage.setItem('nexus_token', data.access_token);
    localStorage.setItem('nexus_user', JSON.stringify(data.user));
    setUser(data.user);
    
    await fetchInitialData(data.access_token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
  };

  // Cooldown calculation helper
  const getQuizCooldownStatus = (courseId: string): QuizCooldownInfo => {
    if (!user) return { inCooldown: false, remainingSeconds: 0, failCount: 0, cooldownTotalMinutes: 0 };
    const p = progress.find(item => item.userId === user.id && item.courseId === courseId);
    if (!p || !p.failCount || p.failCount < 3 || !p.lastAttemptTime) {
      return { inCooldown: false, remainingSeconds: 0, failCount: p?.failCount || 0, cooldownTotalMinutes: 0 };
    }

    // Cooldown duration: 3rd fail -> 30 mins (1800s), 4th+ fail -> 3 hours (10800s)
    const cooldownDurationSeconds = p.failCount === 3 ? 30 * 60 : 3 * 60 * 60;
    const cooldownTotalMinutes = p.failCount === 3 ? 30 : 180;
    const lastTime = new Date(p.lastAttemptTime).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastTime) / 1000);
    const remainingSeconds = Math.max(0, cooldownDurationSeconds - elapsedSeconds);

    return {
      inCooldown: remainingSeconds > 0,
      remainingSeconds,
      failCount: p.failCount,
      cooldownTotalMinutes
    };
  };

  const submitQuiz = async (courseId: string, score: number, satisfaction: number): Promise<{ passed: boolean; failCount: number }> => {
    if (!user) return { passed: false, failCount: 0 };
    
    const course = courses.find(c => c.id === courseId);
    const passThreshold = course?.passScore !== undefined ? course.passScore : 70;
    const passed = score >= passThreshold;
    
    const existing = progress.find(p => p.userId === user.id && p.courseId === courseId);
    const currentFails = existing?.failCount || 0;
    const newFailCount = passed ? 0 : currentFails + 1;
    const nowIso = new Date().toISOString();

    const token = localStorage.getItem('nexus_token');
    try {
       await fetch('/api/progress', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
          body: JSON.stringify({ 
            course_id: courseId, 
            completed: passed, 
            quiz_score: score, 
            satisfaction,
            fail_count: newFailCount,
            last_attempt_time: nowIso
          })
      });
    } catch(e) {
        console.error("Failed to save progress remotely", e);
    }

    setProgress(prev => {
      const filtered = prev.filter(p => !(p.userId === user.id && p.courseId === courseId));
      const newProgress: CourseProgress = {
        userId: user.id,
        courseId,
        completed: passed, 
        quizScore: score,
        satisfaction,
        attemptDate: nowIso,
        failCount: newFailCount,
        lastAttemptTime: nowIso
      };
      return [...filtered, newProgress];
    });

    return { passed, failCount: newFailCount };
  };

  const completeAssessment = (scores: AssessmentScores) => {
    if (!user) return;
    const updatedUser = { ...user, profile: { ...user.profile, assessment: scores } };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  const submitSkillAssessment = (score: number) => {
    if (!user) return;
    const updatedUser = { 
        ...user, 
        profile: { 
            ...user.profile, 
            skillAssessmentScore: score 
        } 
    };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  // --- Admin Actions (Courses) ---

  const addCourse = async (course: Course): Promise<Course | undefined> => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(course)
      });
      if (res.ok) {
        const savedCourse = await res.json();
        setCourses(prev => [...prev.filter(c => c.id !== savedCourse.id), savedCourse]);
        // Refresh announcements since auto announcement may have been generated
        if (token) {
          fetch('/api/announcements', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.ok && r.json()).then(data => data && setAnnouncements(data)).catch(() => {});
        }
        return savedCourse;
      } else {
        const err = await res.json();
        alert(err.detail || '建立課程失敗');
      }
    } catch (e) {
      console.error(e);
      // Local fallback
      setCourses(prev => [...prev, course]);
      return course;
    }
  };

  const updateCourse = async (updatedCourse: Course): Promise<Course | undefined> => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/courses/${updatedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedCourse)
      });
      if (res.ok) {
        const savedCourse = await res.json();
        setCourses(prev => prev.map(c => c.id === savedCourse.id ? savedCourse : c));
        if (token) {
          fetch('/api/announcements', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.ok && r.json()).then(data => data && setAnnouncements(data)).catch(() => {});
        }
        return savedCourse;
      } else {
        alert('更新課程失敗');
      }
    } catch (e) {
      console.error(e);
      setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      return updatedCourse;
    }
  };

  const deleteCourse = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== id));
      } else {
        alert('刪除課程失敗');
      }
    } catch (e) {
      console.error(e);
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const duplicateCourse = async (id: string): Promise<Course | undefined> => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/courses/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const dup = await res.json();
        setCourses(prev => [...prev, dup]);
        return dup;
      }
    } catch (e) {
      console.error(e);
    }
    // Local fallback
    const target = courses.find(c => c.id === id);
    if (target) {
      const dup: Course = {
        ...target,
        id: `c_${Date.now()}`,
        title: `${target.title} (副本)`,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCourses(prev => [...prev, dup]);
      return dup;
    }
  };

  const setCourseStatus = async (id: string, status: CourseStatus) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    const updated = { ...course, status };
    await updateCourse(updated);
  };

  // --- Category Actions ---
  const addCategory = async (name: string) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories(prev => [...prev.filter(c => c.id !== cat.id), cat]);
      } else {
        const err = await res.json();
        alert(err.detail || '新增分類失敗');
      }
    } catch (e) {
      setCategories(prev => [...prev, { id: Date.now(), name, createdAt: new Date().toISOString().split('T')[0] }]);
    }
  };

  const updateCategory = async (id: number, name: string) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
        // Refresh courses since course categories may have been updated
        if (token) {
          fetch('/api/courses', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.ok && r.json()).then(data => data && setCourses(data)).catch(() => {});
        }
      }
    } catch (e) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    }
  };

  const deleteCategory = async (id: number) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  // --- Announcement Actions ---
  const addAnnouncement = async (data: Partial<Announcement>) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const ann = await res.json();
        setAnnouncements(prev => [ann, ...prev]);
      }
    } catch (e) {
      const fallbackAnn: Announcement = {
        id: Date.now(),
        title: data.title || '',
        content: data.content || '',
        type: data.type || 'notice',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isPinned: !!data.isPinned,
        author: user?.name || '管理員'
      };
      setAnnouncements(prev => [fallbackAnn, ...prev]);
    }
  };

  const updateAnnouncement = async (id: number, data: Partial<Announcement>) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        setAnnouncements(prev => prev.map(a => a.id === id ? updated : a));
      }
    } catch (e) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...data } as Announcement : a));
    }
  };

  const deleteAnnouncement = async (id: number) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  // --- Admin Actions (Users) ---

  const addUser = async (newUser: User) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const savedUser = await res.json();
        setAllUsers(prev => [...prev.filter(u => u.id !== savedUser.id), savedUser]);
      } else {
        alert('新增使用者失敗，請確認員工編號是否重複');
      }
    } catch (e) {
      setAllUsers(prev => [...prev, newUser]);
    }
  };

  const updateUser = async (updatedUser: User) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedUser)
      });
      if (res.ok) {
        const savedUser = await res.json();
        setAllUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
        if (user && user.id === savedUser.id) {
          setUser(savedUser);
        }
      } else {
        alert('更新使用者失敗');
      }
    } catch (e) {
      setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  };

  const deleteUser = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAllUsers(prev => prev.filter(u => u.id !== id));
      } else {
        alert('刪除使用者失敗');
      }
    } catch (e) {
      setAllUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // --- Getters ---

  const getCourseProgress = (courseId: string) => {
    if (!user) return undefined;
    return progress.find(p => p.userId === user.id && p.courseId === courseId);
  };

  const getUserById = (id: string) => {
    return allUsers.find(u => u.id === id);
  };

  const getDashboardStats = (): DashboardStats => {
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7); // YYYY-MM

    // Number of published courses created in this month
    const newCoursesThisMonth = courses.filter(c => c.createdAt && c.createdAt.startsWith(currentMonthPrefix)).length;
    
    // Number of active quizzes created this month (based on courses that have questions and created this month)
    const newQuizzesThisMonth = courses.filter(c => c.createdAt && c.createdAt.startsWith(currentMonthPrefix) && (c.questions?.length || 0) > 0).length;
    
    // Number of employees joined this month
    const newEmployeesThisMonth = allUsers.filter(u => 
        u.role === 'employee' && u.profile?.joinDate && u.profile.joinDate.startsWith(currentMonthPrefix)
    ).length;

    return {
        newCoursesThisMonth,
        newQuizzesThisMonth,
        newEmployeesThisMonth
    };
  };

  const getAllUserMetrics = (): TalentMetric[] => {
    return allUsers.filter(u => u.role === 'employee').map(u => {
      const userProgress = progress.filter(p => p.userId === u.id);
      const totalCourses = userProgress.length;
      const completedCourses = userProgress.filter(p => p.completed).length;
      
      let avgScore = 0;
      if (totalCourses > 0) {
        const sum = userProgress.reduce((acc, curr) => acc + (curr.quizScore || 0), 0);
        avgScore = Math.round(sum / totalCourses);
      }

      // --- Dynamic 9-Box Calculation ---
      const perfHistory = u.profile?.performanceHistory || [];
      let avgPerf = 0;
      if (perfHistory.length > 0) {
        avgPerf = perfHistory.reduce((acc, curr) => acc + curr.rating, 0) / perfHistory.length;
      }
      
      let perfCategory: 'Low' | 'Medium' | 'High' = 'Low';
      if (avgPerf >= 4) perfCategory = 'High';
      else if (avgPerf >= 3) perfCategory = 'Medium';

      const skillScore = u.profile?.skillAssessmentScore || 0;
      const age = u.profile?.age || 30;
      const ageScore = Math.max(0, Math.min(50, 50 - ((age - 20) * 1.25)));
      const totalPotential = skillScore + ageScore;
      
      let potCategory: 'Low' | 'Medium' | 'High' = 'Low';
      if (totalPotential >= 80) potCategory = 'High';
      else if (totalPotential >= 60) potCategory = 'Medium';

      const updatedProfile = {
        ...u.profile,
        nineBoxPosition: { performance: perfCategory, potential: potCategory }
      };

      return {
        userId: u.id,
        userName: u.name,
        department: u.department,
        averageScore: avgScore,
        completedCoursesCount: completedCourses,
        isHighPotential: potCategory === 'High' && perfCategory === 'High',
        profile: updatedProfile,
        calculatedPot: totalPotential,
        calculatedPerf: avgPerf,
        internalEmail: u.internalEmail
      };
    }).sort((a, b) => b.averageScore - a.averageScore);
  };

  return (
    <StoreContext.Provider value={{ 
      user, login, logout, 
      courses, progress, allUsers, categories, announcements,
      submitQuiz, completeAssessment, submitSkillAssessment,
      addCourse, updateCourse, deleteCourse, duplicateCourse, setCourseStatus,
      addUser, updateUser, deleteUser,
      addCategory, updateCategory, deleteCategory,
      addAnnouncement, updateAnnouncement, deleteAnnouncement,
      getCourseProgress, getQuizCooldownStatus, getAllUserMetrics, getUserById, getDashboardStats
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};