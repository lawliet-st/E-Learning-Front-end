import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { Trophy, TrendingUp, Users, Download, Filter, X, Check, BookOpen, Calendar, ClipboardList, AlertCircle, FileSpreadsheet, CheckCircle2, ChevronRight, Printer, FileText, Send, Sparkles, Building2, UserCheck, Award } from 'lucide-react';
import { Course, User } from '../types';

const AdminDashboard: React.FC = () => {
  const { getAllUserMetrics, courses, progress, getDashboardStats, allUsers, categories: storeCategories, user: currentUser } = useStore();
  const metrics = useMemo(() => getAllUserMetrics(), [getAllUserMetrics]);
  const dashboardStats = getDashboardStats();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals State
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [showAnnualReportModal, setShowAnnualReportModal] = useState(false);
  const [showCompulsoryPickerModal, setShowCompulsoryPickerModal] = useState(false);

  // Selected course for compulsory incomplete modal
  const compulsoryCourses = useMemo(() => courses.filter(c => c.type === 'compulsory'), [courses]);
  const [selectedCompulsoryCourseId, setSelectedCompulsoryCourseId] = useState<string>('');

  // Editable Executive Summaries
  const [monthlyExecSummary, setMonthlyExecSummary] = useState(
    '本月全體同仁積極參與各項數位與專業教育訓練，各部門整體完課率與測驗及格率均維持高水準。建議持續深化製程安全與數位技能實務演練，並針對少數未及格同仁進行個別輔導機制。'
  );
  const [annualExecSummary, setAnnualExecSummary] = useState(
    '年度培訓策略成效顯著，核心必修課程全員覆蓋率達標。次年規劃將深化技術骨幹經驗傳承，並導入更多跨領域數位創新與敏捷管理主題。'
  );

  // Categories
  const categories = useMemo(() => {
    return ['all', ...storeCategories.map(c => c.name)];
  }, [storeCategories]);

  // Filtered courses for stats
  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(c => (c.category || '未分類') === selectedCategory);

  // KPI Data
  const highPotentials = metrics.filter(m => m.isHighPotential);
  const topPerformers = metrics.slice(0, 5);
  const globalAverage = Math.round(metrics.reduce((acc, curr) => acc + curr.averageScore, 0) / (metrics.length || 1));

  // Performance Chart Data
  const performanceChartData = metrics.map(m => ({
    name: m.userName.split(' ')[0], 
    score: m.averageScore,
    isHighPotential: m.isHighPotential
  }));

  // Helper to trigger CSV download
  const downloadCsv = (filename: string, csvContent: string) => {
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Export Single Course Report
  const handleExportSingleCourse = (course: Course) => {
    let header = "員工工號,員工姓名,部門,職稱,內部信箱,課程名稱,課程類別,測驗分數,及格標準,是否通過,滿意度評分,完成日期\n";
    let content = header;

    allUsers.filter(u => u.role === 'employee').forEach(u => {
      const p = progress.find(item => item.userId === u.id && item.courseId === course.id);
      const score = p?.quizScore !== null && p?.quizScore !== undefined ? p.quizScore : '未測驗';
      const passScore = course.passScore || 70;
      const passed = p?.completed ? '是 (已通過)' : (p?.quizScore !== null && p?.quizScore !== undefined ? '否 (未及格)' : '尚未完成');
      const sat = p?.satisfaction ? `${p.satisfaction} 星` : '未評分';
      const date = p?.attemptDate ? p.attemptDate.replace('T', ' ') : '無';

      content += `${u.employeeId || u.id},${u.name},${u.department},${u.title || ''},${u.internalEmail || ''},${course.title},${course.category},${score},${passScore},${passed},${sat},${date}\n`;
    });

    downloadCsv(`盛餘LMS_單堂課程報告_${course.title}.csv`, content);
  };

  // Monthly Report Calculations
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. 2026-08
  const currentYearStr = new Date().getFullYear().toString();

  const monthlyProgress = useMemo(() => {
    return progress.filter(p => p.attemptDate && p.attemptDate.startsWith(currentMonthStr));
  }, [progress, currentMonthStr]);

  const monthlyCompletedCount = monthlyProgress.filter(p => p.completed).length;
  const monthlyTestedCount = monthlyProgress.filter(p => p.quizScore !== null && p.quizScore !== undefined).length;
  const monthlyPassedCount = monthlyProgress.filter(p => p.completed).length;
  const monthlyPassRate = monthlyTestedCount > 0 ? Math.round((monthlyPassedCount / monthlyTestedCount) * 100) : 100;
  const monthlyAvgScore = monthlyTestedCount > 0 ? Math.round(monthlyProgress.reduce((a, b) => a + (b.quizScore || 0), 0) / monthlyTestedCount) : 0;
  const monthlySatList = monthlyProgress.filter(p => p.satisfaction);
  const monthlyAvgSat = monthlySatList.length > 0 ? (monthlySatList.reduce((a, b) => a + (b.satisfaction || 0), 0) / monthlySatList.length).toFixed(1) : '5.0';

  // ==========================================
  // Core KPI Calculations (Monthly & Annual)
  // ==========================================
  const totalEmployees = allUsers.filter(u => u.role === 'employee').length || 1;

  // Monthly Metrics
  const monthlyTotalHours = useMemo(() => {
    let totalSecs = 0;
    monthlyProgress.filter(p => p.completed).forEach(p => {
      const c = courses.find(course => course.id === p.courseId);
      totalSecs += c?.durationSeconds || 3600;
    });
    return Math.round((totalSecs / 3600) * 10) / 10;
  }, [monthlyProgress, courses]);

  const monthlyAvgHoursPerEmployee = Math.round((monthlyTotalHours / totalEmployees) * 10) / 10;
  const monthlyAvgCoursesPerEmployee = Math.round((monthlyCompletedCount / totalEmployees) * 10) / 10;

  // Compulsory vs Elective completion in monthly
  const monthlyCompulsoryCompleted = useMemo(() => {
    return monthlyProgress.filter(p => p.completed && courses.find(c => c.id === p.courseId)?.type === 'compulsory').length;
  }, [monthlyProgress, courses]);
  const monthlyElectiveCompleted = monthlyCompletedCount - monthlyCompulsoryCompleted;

  // Annual Metrics
  const annualTotalCompletions = progress.filter(p => p.completed).length;
  const annualTotalHours = useMemo(() => {
    let totalSecs = 0;
    progress.filter(p => p.completed).forEach(p => {
      const c = courses.find(course => course.id === p.courseId);
      totalSecs += c?.durationSeconds || 3600;
    });
    return Math.round((totalSecs / 3600) * 10) / 10;
  }, [progress, courses]);

  const annualAvgHoursPerEmployee = Math.round((annualTotalHours / totalEmployees) * 10) / 10;
  const annualAvgCoursesPerEmployee = Math.round((annualTotalCompletions / totalEmployees) * 10) / 10;
  const annualTested = progress.filter(p => p.quizScore !== null && p.quizScore !== undefined);
  const annualPassed = annualTested.filter(p => p.completed).length;
  const annualPassRate = annualTested.length > 0 ? Math.round((annualPassed / annualTested.length) * 100) : 100;
  const annualSatList = progress.filter(p => p.satisfaction);
  const annualAvgSat = annualSatList.length > 0 ? (annualSatList.reduce((a, b) => a + (b.satisfaction || 0), 0) / annualSatList.length).toFixed(1) : '5.0';

  // Enhanced Department Stats with Hours and Avg Courses
  const enhancedDeptStats = useMemo(() => {
    const depts: Record<string, { totalEmployees: number; completedCourses: number; totalHours: number; totalScore: number; scoreCount: number }> = {};
    allUsers.filter(u => u.role === 'employee').forEach(u => {
      if (!depts[u.department]) {
        depts[u.department] = { totalEmployees: 0, completedCourses: 0, totalHours: 0, totalScore: 0, scoreCount: 0 };
      }
      depts[u.department].totalEmployees++;
    });

    progress.forEach(p => {
      const u = allUsers.find(user => user.id === p.userId);
      const c = courses.find(course => course.id === p.courseId);
      if (u && depts[u.department]) {
        if (p.completed) {
          depts[u.department].completedCourses++;
          depts[u.department].totalHours += (c?.durationSeconds || 3600) / 3600;
        }
        if (p.quizScore !== null && p.quizScore !== undefined) {
          depts[u.department].totalScore += p.quizScore;
          depts[u.department].scoreCount++;
        }
      }
    });

    return Object.entries(depts).map(([name, data]) => {
      const empCount = data.totalEmployees || 1;
      return {
        name,
        totalEmployees: data.totalEmployees,
        completedCourses: data.completedCourses,
        totalHours: Math.round(data.totalHours * 10) / 10,
        avgHoursPerEmp: Math.round((data.totalHours / empCount) * 10) / 10,
        avgCoursesPerEmp: Math.round((data.completedCourses / empCount) * 10) / 10,
        avgScore: data.scoreCount > 0 ? Math.round(data.totalScore / data.scoreCount) : 0,
        completionRate: data.totalEmployees > 0 ? Math.min(100, Math.round((data.completedCourses / (data.totalEmployees * (courses.length || 1))) * 100)) : 0
      };
    });
  }, [allUsers, progress, courses]);

  // Handle Compulsory Incomplete Trainees Calculation for selected course
  const currentSelectedCompCourse = useMemo(() => {
    if (!selectedCompulsoryCourseId) return compulsoryCourses[0] || courses[0];
    return courses.find(c => c.id === selectedCompulsoryCourseId) || courses[0];
  }, [selectedCompulsoryCourseId, compulsoryCourses, courses]);

  const incompleteTraineesForCourse = useMemo(() => {
    if (!currentSelectedCompCourse) return [];
    
    // Find targeted users
    let targetUsers = allUsers.filter(u => u.role === 'employee');
    if (currentSelectedCompCourse.compulsoryTargets) {
      const depts = currentSelectedCompCourse.compulsoryTargets.departments || [];
      const uids = currentSelectedCompCourse.compulsoryTargets.userIds || [];
      if (depts.length > 0 || uids.length > 0) {
        targetUsers = targetUsers.filter(u => depts.includes(u.department) || uids.includes(u.id));
      }
    }

    return targetUsers.filter(u => {
      const p = progress.find(item => item.userId === u.id && item.courseId === currentSelectedCompCourse.id);
      return !p || !p.completed;
    }).map(u => {
      const p = progress.find(item => item.userId === u.id && item.courseId === currentSelectedCompCourse.id);
      return {
        user: u,
        status: !p ? '尚未開始' : (p.quizScore !== null ? '測驗未通過' : '學習中'),
        lastScore: p?.quizScore !== null && p?.quizScore !== undefined ? p.quizScore : null,
        failCount: p?.failCount || 0,
        lastAttempt: p?.attemptDate || '-'
      };
    });
  }, [currentSelectedCompCourse, allUsers, progress]);

  // Export specific course compulsory incomplete list to CSV
  const handleExportSelectedCompulsoryCsv = () => {
    if (!currentSelectedCompCourse) return;
    let header = "員工工號,員工姓名,部門,職稱,內部信箱,課程名稱,課程分類,及格門檻,當前學習狀態,上一次測驗分數,累計未通過次數,最後測驗時間\n";
    let content = header;

    incompleteTraineesForCourse.forEach(item => {
      const u = item.user;
      content += `${u.employeeId || u.id},${u.name},${u.department},${u.title || ''},${u.internalEmail || ''},${currentSelectedCompCourse.title},${currentSelectedCompCourse.category},${currentSelectedCompCourse.passScore || 70},${item.status},${item.lastScore !== null ? `${item.lastScore}分` : '無'},${item.failCount},${item.lastAttempt}\n`;
    });

    downloadCsv(`盛餘LMS_必修未完成名單_${currentSelectedCompCourse.title}.csv`, content);
  };

  // Trigger Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Executive Report Command Center */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-wide">戰情室 (Admin War Room)</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-300 border border-brand-400/40">
              Executive BI
            </span>
          </div>
          <p className="text-xs text-indigo-200/80 mt-1">組織學習成效監控、專業主管呈核報告與多維度課程數據指標。</p>
        </div>

        {/* Executive Report Entry Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setShowMonthlyReportModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            title="開啟主管呈核專用當月訓練成果報告"
          >
            <Calendar className="h-4 w-4 text-brand-200" /> 呈核當月報表
          </button>

          <button 
            onClick={() => setShowAnnualReportModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            title="開啟主管呈核專用年度學習戰略分析總表"
          >
            <FileSpreadsheet className="h-4 w-4 text-purple-200" /> 呈核年度總表
          </button>

          <button 
            onClick={() => {
              if (compulsoryCourses.length > 0 && !selectedCompulsoryCourseId) {
                setSelectedCompulsoryCourseId(compulsoryCourses[0].id);
              }
              setShowCompulsoryPickerModal(true);
            }}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            title="先選取指定必修課程，再抓取並匯出未完成學員名單"
          >
            <AlertCircle className="h-4 w-4" /> 必修未完成名單
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">組織平均測驗成績</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{globalAverage} <span className="text-base font-normal text-slate-500">分</span></p>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">在職受訓員工數</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{metrics.length} <span className="text-base font-normal text-slate-500">人</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">線上課程總數</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{courses.length} <span className="text-base font-normal text-slate-500">門</span></p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Monthly Dynamic Metric Cards */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Calendar className="h-4 w-4 text-brand-600" /> 本月新增營運數據
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-900 font-semibold">本月上架新課程</span>
              <p className="text-2xl font-black text-blue-900 mt-1">{dashboardStats.newCoursesThisMonth} <span className="text-xs font-normal text-blue-700">門</span></p>
            </div>
            <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-xs"><BookOpen className="h-5 w-5" /></div>
          </div>
          <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/50 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-purple-900 font-semibold">本月新增題庫測驗</span>
              <p className="text-2xl font-black text-purple-900 mt-1">{dashboardStats.newQuizzesThisMonth} <span className="text-xs font-normal text-purple-700">組</span></p>
            </div>
            <div className="p-2.5 bg-purple-500 text-white rounded-xl shadow-xs"><ClipboardList className="h-5 w-5" /></div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-900 font-semibold">本月新進人員</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{dashboardStats.newEmployeesThisMonth} <span className="text-xs font-normal text-emerald-700">位</span></p>
            </div>
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-xs"><Users className="h-5 w-5" /></div>
          </div>
        </div>
      </section>

      {/* Redesigned Course Analytics Section with Horizontal High-end Score Distributions */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" />
              課程分析數據看板
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">即時掌握每堂課之完課率、及格率、學員滿意度與高質感橫向成績區間分佈。</p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? '全部類別' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => {
            const courseProgress = progress.filter(p => p.courseId === course.id);
            const completed = courseProgress.filter(p => p.completed).length;
            const totalEmployees = allUsers.filter(u => u.role === 'employee').length;
            const completionRate = totalEmployees > 0 ? Math.round((completed / totalEmployees) * 100) : 0;

            const tested = courseProgress.filter(p => p.quizScore !== null && p.quizScore !== undefined);
            const passed = tested.filter(p => p.completed).length;
            const passRate = tested.length > 0 ? Math.round((passed / tested.length) * 100) : 0;
            const avgScore = tested.length > 0 ? Math.round(tested.reduce((a, b) => a + (b.quizScore || 0), 0) / tested.length) : 0;

            // Satisfaction
            const satList = courseProgress.filter(p => p.satisfaction);
            const avgSat = satList.length > 0 ? (satList.reduce((a, b) => a + (b.satisfaction || 0), 0) / satList.length).toFixed(1) : '無';

            // High-End Modern Horizontal Score Distribution Breakdown
            const failCount = tested.filter(s => (s.quizScore || 0) < (course.passScore || 70)).length;
            const goodCount = tested.filter(s => (s.quizScore || 0) >= (course.passScore || 70) && (s.quizScore || 0) < 85).length;
            const excelCount = tested.filter(s => (s.quizScore || 0) >= 85).length;
            const totalTested = tested.length || 1;

            const failPercent = Math.round((failCount / totalTested) * 100);
            const goodPercent = Math.round((goodCount / totalTested) * 100);
            const excelPercent = Math.round((excelCount / totalTested) * 100);

            return (
              <div key={course.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 mr-1.5">
                        {course.category}
                      </span>
                      {course.type === 'compulsory' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">
                          必修
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-500">
                          選修
                        </span>
                      )}
                      <h3 className="font-bold text-base text-slate-900 mt-1 line-clamp-1" title={course.title}>
                        {course.title}
                      </h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center text-amber-500 font-bold text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 mr-0.5" />
                        <span>{avgSat}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">({satList.length} 則評價)</span>
                    </div>
                  </div>

                  {/* Metrics Bar Matrix */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center mb-4 border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400">完課人數</div>
                      <div className="text-sm font-black text-slate-800 mt-0.5">{completed} <span className="text-[10px] font-normal text-slate-400">/ {totalEmployees}</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">完課率</div>
                      <div className="text-sm font-black text-emerald-600 mt-0.5">{completionRate}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">測驗及格率</div>
                      <div className={`text-sm font-black mt-0.5 ${passRate >= 70 ? 'text-brand-600' : 'text-rose-600'}`}>{passRate}%</div>
                    </div>
                  </div>

                  {/* Redesigned Modern Horizontal Score Distribution Bars */}
                  <div className="mb-4 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-bold text-slate-700">成績區間分佈 (橫向統計)</span>
                      <span className="text-[10px] text-slate-500">
                        平均: <strong className="text-slate-900 font-black">{avgScore}分</strong> (及格:{course.passScore || 70})
                      </span>
                    </div>

                    {/* Stacked Visual Bar */}
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                      <div style={{ width: `${excelPercent}%` }} className="bg-emerald-500 transition-all" title={`85-100分: ${excelCount}人 (${excelPercent}%)`} />
                      <div style={{ width: `${goodPercent}%` }} className="bg-indigo-500 transition-all" title={`70-84分: ${goodCount}人 (${goodPercent}%)`} />
                      <div style={{ width: `${failPercent}%` }} className="bg-rose-500 transition-all" title={`<70分: ${failCount}人 (${failPercent}%)`} />
                    </div>

                    {/* Horizontal Legend & Counts */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-slate-600 truncate">優良 85+: <strong>{excelCount}人</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        <span className="text-slate-600 truncate">良好 70-84: <strong>{goodCount}人</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-slate-600 truncate">未及格: <strong>{failCount}人</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Download Action */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {course.id}</span>
                  <button
                    onClick={() => handleExportSingleCourse(course)}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> 下載此課程報告
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Performance Chart & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">員工平均績效分數概覽</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={36} fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
               <Trophy className="h-5 w-5 text-amber-500" />
               學習績效排行榜 Top 5
             </h3>
             <Link to="/learning-records" className="text-xs text-brand-600 hover:text-brand-800 font-bold flex items-center">
               查看全員紀錄 <ChevronRight className="h-3.5 w-3.5" />
             </Link>
          </div>
          <div className="space-y-3">
            {topPerformers.map((user, idx) => (
              <Link to={`/profile/${user.userId}`} key={user.userId} className="flex items-center p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group">
                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl font-bold text-xs mr-3.5 ${
                  idx === 0 ? 'bg-amber-100 text-amber-800 shadow-xs' : 
                  idx === 1 ? 'bg-slate-200 text-slate-700' : 
                  idx === 2 ? 'bg-orange-100 text-orange-800' : 
                  'bg-slate-100 text-slate-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-brand-600 truncate">{user.userName}</p>
                  <p className="text-[10px] text-slate-400">{user.department}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="block text-xs font-black text-slate-900">{user.averageScore} 分</span>
                  <span className="text-[10px] text-emerald-600 font-medium">完課 {user.completedCoursesCount} 門</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: 當月教育訓練成果報告 (Executive Monthly Training Report) */}
      {/* ========================================================================= */}
      {showMonthlyReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col p-6 sm:p-8 animate-fade-in text-slate-800 relative border border-slate-200">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" />
                <span className="text-sm font-bold text-slate-900">當月份教育訓練成果報告 (重點 KPI 儀表)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <Printer className="h-4 w-4" /> 列印 / 匯出 PDF
                </button>
                <button
                  onClick={() => {
                    let header = "工號,姓名,部門,課程,分數,狀態,完成日期\n";
                    let content = header;
                    monthlyProgress.forEach(p => {
                      const u = allUsers.find(user => user.id === p.userId);
                      const c = courses.find(course => course.id === p.courseId);
                      if (u && c) {
                        content += `${u.employeeId || u.id},${u.name},${u.department},${c.title},${p.quizScore ?? '-'},${p.completed ? '及格' : '未及格'},${p.attemptDate || '-'}\n`;
                      }
                    });
                    downloadCsv(`盛餘LMS_${currentMonthStr}_當月訓練成果報告.csv`, content);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Download className="h-4 w-4" /> 匯出 CSV
                </button>
                <button 
                  onClick={() => setShowMonthlyReportModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 print:p-0 print:overflow-visible">
              {/* Report Official Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-1">SHENG YU STEEL CO., LTD. • E-LEARNING ACADEMY</div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">盛餘 【{currentMonthStr}】教育訓練成果報告</h2>
                <div className="flex flex-wrap justify-between items-center text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
                  <span>統計月份：<strong className="text-slate-900">{currentMonthStr}</strong></span>
                  <span>產表日期：<strong className="text-slate-900">{new Date().toLocaleDateString('zh-TW')}</strong></span>
                  <span>受訓員工總數：<strong className="text-slate-900">{totalEmployees} 位</strong></span>
                </div>
              </div>

              {/* 1. Six Core Key Performance Indicators (重點 KPI 儀表板) */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-brand-600" /> 一、當月核心培訓指標 (Core Performance KPIs)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  {/* KPI 1: 課程完成度狀況 */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500">當月完課通過率</div>
                    <div className="text-xl font-black text-emerald-600 mt-1">{monthlyPassRate}%</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{monthlyCompletedCount} 門次完成</div>
                  </div>

                  {/* KPI 2: 平均上課人時 */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500">平均上課人時</div>
                    <div className="text-xl font-black text-brand-600 mt-1">{monthlyAvgHoursPerEmployee} <span className="text-xs font-normal">小時/人</span></div>
                    <div className="text-[10px] text-slate-400 mt-0.5">總受訓 {monthlyTotalHours} 小時</div>
                  </div>

                  {/* KPI 3: 平均上課堂數 */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500">平均上課堂數</div>
                    <div className="text-xl font-black text-indigo-600 mt-1">{monthlyAvgCoursesPerEmployee} <span className="text-xs font-normal">堂/人</span></div>
                    <div className="text-[10px] text-slate-400 mt-0.5">累計受訓人次 {monthlyProgress.length}</div>
                  </div>

                  {/* KPI 4: 課程滿意度 */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500">課程滿意度</div>
                    <div className="text-xl font-black text-amber-500 mt-1">{monthlyAvgSat} <span className="text-xs">★</span></div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{monthlySatList.length} 份評鑑填答</div>
                  </div>

                  {/* KPI 5: 測驗平均成績 */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500">測驗平均成績</div>
                    <div className="text-xl font-black text-slate-900 mt-1">{monthlyAvgScore} <span className="text-xs font-normal">分</span></div>
                    <div className="text-[10px] text-slate-400 mt-0.5">及格標準 70 分</div>
                  </div>

                  {/* KPI 6: 必修 vs 選修完成分佈 */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500">必修/選修完課</div>
                    <div className="text-lg font-black text-purple-700 mt-1">{monthlyCompulsoryCompleted} / {monthlyElectiveCompleted}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">必修 / 選修 (門次)</div>
                  </div>
                </div>
              </div>

              {/* 2. Editable Executive Summary */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
                <div className="flex justify-between items-center mb-1.5">
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" /> 二、管理摘要與重點說明 (可直接點擊編輯調整文字)
                  </h4>
                  <span className="text-[10px] text-blue-700/70 font-semibold print:hidden">可自由編輯</span>
                </div>
                <textarea
                  rows={2}
                  value={monthlyExecSummary}
                  onChange={(e) => setMonthlyExecSummary(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-white/90 border border-blue-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* 3. Department Training KPIs Table (含人均時數、人均堂數、完課率) */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-brand-600" /> 三、各部門受訓成效與人均時數對比
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">部門名稱</th>
                        <th className="p-2.5 text-center">員工數</th>
                        <th className="p-2.5 text-center">總完課門次</th>
                        <th className="p-2.5 text-center">平均上課堂數</th>
                        <th className="p-2.5 text-center">平均上課人時</th>
                        <th className="p-2.5 text-center">平均測驗成績</th>
                        <th className="p-2.5 text-center">完課進度</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enhancedDeptStats.map(d => (
                        <tr key={d.name} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{d.name}</td>
                          <td className="p-2.5 text-center text-slate-600">{d.totalEmployees} 人</td>
                          <td className="p-2.5 text-center font-bold text-slate-800">{d.completedCourses} 門次</td>
                          <td className="p-2.5 text-center font-bold text-indigo-600">{d.avgCoursesPerEmp} 堂/人</td>
                          <td className="p-2.5 text-center font-bold text-brand-600">{d.avgHoursPerEmp} 小時/人</td>
                          <td className="p-2.5 text-center font-bold text-slate-700">{d.avgScore} 分</td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${d.completionRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {d.completionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Course Details List for Current Month */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-brand-600" /> 四、當月開辦課程修習成果明細
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">課程名稱</th>
                        <th className="p-2.5 text-center">領域分類</th>
                        <th className="p-2.5 text-center">性質</th>
                        <th className="p-2.5 text-center">受訓人次</th>
                        <th className="p-2.5 text-center">完課通過率</th>
                        <th className="p-2.5 text-center">平均成績</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courses.slice(0, 8).map(c => {
                        const cProg = monthlyProgress.filter(p => p.courseId === c.id);
                        const cTested = cProg.filter(p => p.quizScore !== null);
                        const cPassed = cProg.filter(p => p.completed).length;
                        const cRate = cTested.length > 0 ? Math.round((cPassed / cTested.length) * 100) : 100;
                        const cAvg = cTested.length > 0 ? Math.round(cTested.reduce((a, b) => a + (b.quizScore || 0), 0) / cTested.length) : 0;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{c.title}</td>
                            <td className="p-2.5 text-center text-slate-500">{c.category}</td>
                            <td className="p-2.5 text-center">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.type === 'compulsory' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                {c.type === 'compulsory' ? '必修' : '選修'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-800">{cProg.length} 人</td>
                            <td className="p-2.5 text-center font-bold text-emerald-600">{cRate}%</td>
                            <td className="p-2.5 text-center font-bold text-indigo-600">{cAvg} 分</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 年度教育訓練戰略分析總表 (Annual Strategic Training Report) */}
      {/* ========================================================================= */}
      {showAnnualReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col p-6 sm:p-8 animate-fade-in text-slate-800 relative border border-slate-200">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-bold text-slate-900">年度學習戰略分析總表 (重點 KPI 儀表)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <Printer className="h-4 w-4" /> 列印 / 匯出 PDF
                </button>
                <button
                  onClick={() => {
                    let header = "課程ID,課程名稱,類別,性質,及格門檻,總學員數,完課人數,完課率,及格率,平均分數\n";
                    let content = header;
                    courses.forEach(c => {
                      const cProg = progress.filter(p => p.courseId === c.id);
                      const totalTrainees = allUsers.filter(u => u.role === 'employee').length;
                      const completedCount = cProg.filter(p => p.completed).length;
                      const compRate = totalTrainees > 0 ? `${Math.round((completedCount / totalTrainees) * 100)}%` : '0%';
                      const testedProg = cProg.filter(p => p.quizScore !== null);
                      const passRate = testedProg.length > 0 ? `${Math.round((cProg.filter(p => p.completed).length / testedProg.length) * 100)}%` : '0%';
                      const avgScore = testedProg.length > 0 ? Math.round(testedProg.reduce((a, b) => a + (b.quizScore || 0), 0) / testedProg.length) : 0;
                      content += `${c.id},${c.title},${c.category},${c.type},${c.passScore || 70},${totalTrainees},${completedCount},${compRate},${passRate},${avgScore}\n`;
                    });
                    downloadCsv(`盛餘LMS_${currentYearStr}_年度課程總表報告.csv`, content);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Download className="h-4 w-4" /> 匯出 CSV
                </button>
                <button 
                  onClick={() => setShowAnnualReportModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 print:p-0 print:overflow-visible">
              {/* Official Header */}
              <div className="text-center border-b-2 border-purple-950 pb-4">
                <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-1">SHENG YU STEEL CO., LTD. • ANNUAL STRATEGIC REPORT</div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">盛餘 【{currentYearStr} 年度】教育訓練與學習戰略總表</h2>
                <div className="flex flex-wrap justify-between items-center text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
                  <span>統計年度：<strong className="text-slate-900">{currentYearStr} 全年度</strong></span>
                  <span>產出日期：<strong className="text-slate-900">{new Date().toLocaleDateString('zh-TW')}</strong></span>
                  <span>在職受訓員工數：<strong className="text-slate-900">{totalEmployees} 位</strong></span>
                </div>
              </div>

              {/* 1. Six Strategic Performance KPIs */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-purple-600" /> 一、年度重點培育戰略指標 (Annual Strategic KPIs)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  {/* KPI 1: 總培訓人時 & 人均人時 */}
                  <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-200">
                    <div className="text-[10px] font-semibold text-purple-900">年度平均上課人時</div>
                    <div className="text-xl font-black text-purple-950 mt-1">{annualAvgHoursPerEmployee} <span className="text-xs font-normal">小時/人</span></div>
                    <div className="text-[10px] text-purple-700 mt-0.5">總人時 {annualTotalHours} 小時</div>
                  </div>

                  {/* KPI 2: 平均上課堂數 */}
                  <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200">
                    <div className="text-[10px] font-semibold text-emerald-900">年度平均上課堂數</div>
                    <div className="text-xl font-black text-emerald-950 mt-1">{annualAvgCoursesPerEmployee} <span className="text-xs font-normal">堂/人</span></div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">完課總人次 {annualTotalCompletions}</div>
                  </div>

                  {/* KPI 3: 課程完成度狀況 */}
                  <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200">
                    <div className="text-[10px] font-semibold text-blue-900">年度測驗及格率</div>
                    <div className="text-xl font-black text-blue-950 mt-1">{annualPassRate}%</div>
                    <div className="text-[10px] text-blue-700 mt-0.5">及格人次 {annualPassed}</div>
                  </div>

                  {/* KPI 4: 組織年度平均分數 */}
                  <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-200">
                    <div className="text-[10px] font-semibold text-indigo-900">組織年度平均分數</div>
                    <div className="text-xl font-black text-indigo-950 mt-1">{globalAverage} <span className="text-xs font-normal">分</span></div>
                    <div className="text-[10px] text-indigo-700 mt-0.5">及格門檻 70 分</div>
                  </div>

                  {/* KPI 5: 課程滿意度 */}
                  <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                    <div className="text-[10px] font-semibold text-amber-900">年度課程滿意度</div>
                    <div className="text-xl font-black text-amber-950 mt-1">{annualAvgSat} <span className="text-xs">★</span></div>
                    <div className="text-[10px] text-amber-700 mt-0.5">{annualSatList.length} 份評鑑</div>
                  </div>

                  {/* KPI 6: 開辦課程與高潛人才 */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-700">開辦課程 / 高潛人才</div>
                    <div className="text-lg font-black text-slate-900 mt-1">{courses.length} 門 / {highPotentials.length} 人</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">儲備核心人才庫</div>
                  </div>
                </div>
              </div>

              {/* 2. Editable Annual Evaluation */}
              <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-200">
                <div className="flex justify-between items-center mb-1.5">
                  <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" /> 二、年度培訓效益綜合評估與策略方向 (可直接點擊編輯修改)
                  </h4>
                  <span className="text-[10px] text-purple-700/70 font-semibold print:hidden">可自由編輯</span>
                </div>
                <textarea
                  rows={2}
                  value={annualExecSummary}
                  onChange={(e) => setAnnualExecSummary(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-white/90 border border-purple-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              {/* 3. Department Annual Summary Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-purple-600" /> 三、各部門年度人均時數與完課總量統計
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">部門名稱</th>
                        <th className="p-2.5 text-center">員工數</th>
                        <th className="p-2.5 text-center">總受訓人時</th>
                        <th className="p-2.5 text-center">人均培訓時數</th>
                        <th className="p-2.5 text-center">人均完課堂數</th>
                        <th className="p-2.5 text-center">平均成績</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enhancedDeptStats.map(d => (
                        <tr key={d.name} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{d.name}</td>
                          <td className="p-2.5 text-center text-slate-600">{d.totalEmployees} 人</td>
                          <td className="p-2.5 text-center font-bold text-purple-900">{d.totalHours} 小時</td>
                          <td className="p-2.5 text-center font-bold text-brand-600">{d.avgHoursPerEmp} 小時/人</td>
                          <td className="p-2.5 text-center font-bold text-indigo-600">{d.avgCoursesPerEmp} 堂/人</td>
                          <td className="p-2.5 text-center font-bold text-slate-800">{d.avgScore} 分</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Annual Full Course Overview Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-purple-600" /> 四、全年度開辦課程執行績效明細總表
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2.5">課程名稱</th>
                        <th className="p-2.5 text-center">領域分類</th>
                        <th className="p-2.5 text-center">修習性質</th>
                        <th className="p-2.5 text-center">完課人數</th>
                        <th className="p-2.5 text-center">完課率</th>
                        <th className="p-2.5 text-center">及格率</th>
                        <th className="p-2.5 text-center">滿意度</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courses.map(c => {
                        const cProg = progress.filter(p => p.courseId === c.id);
                        const cCompleted = cProg.filter(p => p.completed).length;
                        const totalEmp = allUsers.filter(u => u.role === 'employee').length;
                        const compRate = totalEmp > 0 ? Math.round((cCompleted / totalEmp) * 100) : 0;
                        const cTested = cProg.filter(p => p.quizScore !== null);
                        const passRate = cTested.length > 0 ? Math.round((cCompleted / cTested.length) * 100) : 0;
                        const satList = cProg.filter(p => p.satisfaction);
                        const avgSat = satList.length > 0 ? (satList.reduce((a, b) => a + (b.satisfaction || 0), 0) / satList.length).toFixed(1) : '-';

                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{c.title}</td>
                            <td className="p-2.5 text-center text-slate-500">{c.category}</td>
                            <td className="p-2.5 text-center">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.type === 'compulsory' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                {c.type === 'compulsory' ? '必修' : '選修'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-800">{cCompleted} 人</td>
                            <td className="p-2.5 text-center font-bold text-emerald-600">{compRate}%</td>
                            <td className="p-2.5 text-center font-bold text-indigo-600">{passRate}%</td>
                            <td className="p-2.5 text-center font-bold text-amber-500">{avgSat} ★</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: 必修未完成名單 (先選擇課程再抓名單與匯出) */}
      {/* ========================================================================= */}
      {showCompulsoryPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 animate-fade-in text-slate-800 relative border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900">必修課程未完成人員名單檢視與匯出</h3>
              </div>
              <button onClick={() => setShowCompulsoryPickerModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {/* Step 1: Course Selector */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  步驟 1. 請先選擇要檢核的必修教育訓練課程：
                </label>
                <select
                  value={selectedCompulsoryCourseId}
                  onChange={(e) => setSelectedCompulsoryCourseId(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-gray-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs"
                >
                  {compulsoryCourses.map(c => (
                    <option key={c.id} value={c.id}>
                      【必修】《{c.title}》— 分類：{c.category} (及格門檻：{c.passScore || 70}分)
                    </option>
                  ))}
                  {courses.filter(c => c.type !== 'compulsory').map(c => (
                    <option key={c.id} value={c.id}>
                      【選修】《{c.title}》— 分類：{c.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Course Summary KPI */}
              {currentSelectedCompCourse && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400">應修習總人數</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">
                      {allUsers.filter(u => u.role === 'employee').length} 位
                    </div>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                    <div className="text-[10px] text-rose-600 font-bold">目前未完成人數</div>
                    <div className="text-base font-black text-rose-600 mt-0.5">
                      {incompleteTraineesForCourse.length} 位
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="text-[10px] text-emerald-600 font-bold">已及格完課人數</div>
                    <div className="text-base font-black text-emerald-700 mt-0.5">
                      {allUsers.filter(u => u.role === 'employee').length - incompleteTraineesForCourse.length} 位
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Trainees List Preview */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    未完成學員清單預覽 ({incompleteTraineesForCourse.length} 位)
                  </h4>
                  <button
                    onClick={handleExportSelectedCompulsoryCsv}
                    disabled={incompleteTraineesForCourse.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <Download className="h-3.5 w-3.5" /> 匯出此名單 (CSV)
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2.5">工號 / 姓名</th>
                        <th className="p-2.5">部門 / 職稱</th>
                        <th className="p-2.5 text-center">目前狀態</th>
                        <th className="p-2.5 text-center">最後測驗成績</th>
                        <th className="p-2.5 text-center">未及格次數</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {incompleteTraineesForCourse.map(({ user, status, lastScore, failCount }) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <span className="font-mono text-slate-400 mr-1.5">{user.employeeId || user.id}</span>
                            <strong className="text-slate-900">{user.name}</strong>
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {user.department} {user.title && `• ${user.title}`}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status === '尚未開始' ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-800'}`}>
                              {status}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            {lastScore !== null ? `${lastScore} 分` : '-'}
                          </td>
                          <td className="p-2.5 text-center font-bold text-rose-600">
                            {failCount > 0 ? `${failCount} 次` : '0'}
                          </td>
                        </tr>
                      ))}
                      {incompleteTraineesForCourse.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-emerald-600 font-bold">
                            🎉 太棒了！全員皆已完成並通過本門課程！
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                可點擊右上角匯出按鈕取得完整名冊以進行催課。
              </span>
              <button
                onClick={() => setShowCompulsoryPickerModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;