import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Course, CourseProgress, TalentMetric, AssessmentScores } from './types';

interface DashboardStats {
  newCoursesThisMonth: number;
  newQuizzesThisMonth: number;
  newEmployeesThisMonth: number;
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
  
  // Actions
  submitQuiz: (courseId: string, score: number, satisfaction: number) => void;
  completeAssessment: (scores: AssessmentScores) => void;
  submitSkillAssessment: (score: number) => void;
  
  // Admin Actions
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;

  // Getters
  getCourseProgress: (courseId: string) => CourseProgress | undefined;
  getAllUserMetrics: () => TalentMetric[];
  getUserById: (id: string) => User | undefined;
  getDashboardStats: () => DashboardStats;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<CourseProgress[]>([]);

  const fetchInitialData = useCallback(async (token: string) => {
      try {
          const headers = { 'Authorization': `Bearer ${token}` };
          const [uRes, cRes, pRes] = await Promise.all([
             fetch('/api/users', {headers}),
             fetch('/api/courses', {headers}),
             fetch('/api/progress', {headers})
          ]);
          if (uRes.ok) setAllUsers(await uRes.json());
          if (cRes.ok) setCourses(await cRes.json());
          if (pRes.ok) setProgress(await pRes.json());
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
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ employee_id: employeeId, password: psw })
    });
    
    if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || '登入失敗');
    }
    const data = await res.json();
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

  const submitQuiz = async (courseId: string, score: number, satisfaction: number) => {
    if (!user) return;
    const token = localStorage.getItem('nexus_token');
    try {
       await fetch('/api/progress', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
          body: JSON.stringify({ course_id: courseId, completed: score >= 60, quiz_score: score, satisfaction })
      });
    } catch(e) {
        console.error("Failed to save progress remotely", e);
    }

    setProgress(prev => {
      const filtered = prev.filter(p => !(p.userId === user.id && p.courseId === courseId));
      
      const newProgress: CourseProgress = {
        userId: user.id,
        courseId,
        completed: score >= 60, 
        quizScore: score,
        satisfaction,
        attemptDate: new Date().toISOString()
      };
      
      return [...filtered, newProgress];
    });
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

  // --- Admin Actions (Persisted to SQLite database) ---

  const addCourse = async (course: Course) => {
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
      } else {
        alert('建立課程失敗');
      }
    } catch (e) {
      console.error(e);
      alert('建立課程發生錯誤');
    }
  };

  const updateCourse = async (updatedCourse: Course) => {
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
      } else {
        alert('更新課程失敗');
      }
    } catch (e) {
      console.error(e);
      alert('更新課程發生錯誤');
    }
  };

  const deleteCourse = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== id));
      } else {
        alert('刪除課程失敗');
      }
    } catch (e) {
      console.error(e);
      alert('刪除課程發生錯誤');
    }
  };

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
      console.error(e);
      alert('新增使用者發生錯誤');
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
      console.error(e);
      alert('更新使用者發生錯誤');
    }
  };

  const deleteUser = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setAllUsers(prev => prev.filter(u => u.id !== id));
      } else {
        alert('刪除使用者失敗');
      }
    } catch (e) {
      console.error(e);
      alert('刪除使用者發生錯誤');
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

    const newCoursesThisMonth = courses.filter(c => c.createdAt && c.createdAt.startsWith(currentMonthPrefix)).length;
    // Assuming 1 quiz per course, so new courses = new quizzes available
    const newQuizzesThisMonth = newCoursesThisMonth; 
    
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
      courses, progress, allUsers,
      submitQuiz, completeAssessment, submitSkillAssessment,
      addCourse, updateCourse, deleteCourse, addUser, updateUser, deleteUser,
      getCourseProgress, getAllUserMetrics, getUserById, getDashboardStats
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