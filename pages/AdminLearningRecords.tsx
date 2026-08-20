import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Search, Download, User, BookOpen, Filter, CheckCircle2, XCircle, Clock, ListFilter, ChevronDown, Check, X } from 'lucide-react';

const AdminLearningRecords: React.FC = () => {
  const { allUsers, courses, progress, categories } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]); // Multi-select course IDs
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'flat' | 'by-user' | 'by-course'>('flat');

  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute all departments for filter dropdown
  const departments = useMemo(() => {
    const depts = new Set(allUsers.filter(u => u.role === 'employee').map(u => u.department));
    return ['All', ...Array.from(depts)];
  }, [allUsers]);

  // Denormalize records: combine users, courses and learning progress
  const allRecords = useMemo(() => {
    const list: any[] = [];
    allUsers.filter(u => u.role === 'employee').forEach(u => {
      const userProgress = progress.filter(p => p.userId === u.id);
      
      courses.forEach(c => {
        const p = userProgress.find(prog => prog.courseId === c.id);
        
        let statusText = '尚未開始';
        let statusColor = 'text-slate-500 bg-slate-100 border-slate-200';
        
        if (p) {
          if (p.completed) {
            statusText = '已完成';
            statusColor = 'text-green-700 bg-green-50 border-green-200';
          } else if (p.quizScore !== null && p.quizScore < (c.passScore || 70)) {
            statusText = '未通過測驗';
            statusColor = 'text-red-700 bg-red-50 border-red-200';
          } else {
            statusText = '進行中';
            statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
          }
        }
        
        const isComp = c.type === 'compulsory' || (c.compulsoryTargets && (c.compulsoryTargets.departments?.includes(u.department) || c.compulsoryTargets.userIds?.includes(u.id)));
        
        list.push({
          userId: u.id,
          employeeId: u.employeeId,
          userName: u.name,
          department: u.department,
          title: u.title,
          courseId: c.id,
          courseTitle: c.title,
          courseCategory: c.category,
          courseType: isComp ? 'compulsory' : 'elective',
          statusText,
          statusColor,
          quizScore: p ? p.quizScore : null,
          satisfaction: p ? p.satisfaction : null,
          attemptDate: p && p.attemptDate ? p.attemptDate.split(' ')[0] : null,
        });
      });
    });
    return list;
  }, [allUsers, courses, progress]);

  // Filter records based on UI controls
  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const matchesSearch = 
        r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesDept = selectedDept === 'All' || r.department === selectedDept;
      const matchesCategory = selectedCategory === 'All' || r.courseCategory === selectedCategory;
      const matchesCourse = selectedCourses.length === 0 || selectedCourses.includes(r.courseId);
      const matchesStatus = selectedStatus === 'All' || r.statusText === selectedStatus;
      
      return matchesSearch && matchesDept && matchesCategory && matchesCourse && matchesStatus;
    });
  }, [allRecords, searchTerm, selectedDept, selectedCategory, selectedCourses, selectedStatus]);

  // Group by User
  const recordsGroupedByUser = useMemo(() => {
    const groups: { [key: string]: { user: any, records: any[] } } = {};
    filteredRecords.forEach(r => {
      if (!groups[r.userId]) {
        groups[r.userId] = {
          user: { name: r.userName, employeeId: r.employeeId, department: r.department, title: r.title },
          records: []
        };
      }
      groups[r.userId].records.push(r);
    });
    return Object.values(groups);
  }, [filteredRecords]);

  // Group by Course
  const recordsGroupedByCourse = useMemo(() => {
    const groups: { [key: string]: { course: any, records: any[] } } = {};
    filteredRecords.forEach(r => {
      if (!groups[r.courseId]) {
        groups[r.courseId] = {
          course: { title: r.courseTitle, category: r.courseCategory, type: r.courseType },
          records: []
        };
      }
      groups[r.courseId].records.push(r);
    });
    return Object.values(groups);
  }, [filteredRecords]);

  // CSV Export Action
  const handleExportCSV = () => {
    const headers = ['員工編號', '員工姓名', '部門', '職稱', '課程名稱', '課程類別', '課程性質', '上課狀態', '測驗分數', '滿意度評分', '最後上課日期'];
    const rows = filteredRecords.map(r => [
      r.employeeId,
      r.userName,
      r.department,
      r.title,
      r.courseTitle,
      r.courseCategory,
      r.courseType === 'compulsory' ? '推薦/必修' : '選修',
      r.statusText,
      r.quizScore !== null ? `${r.quizScore}分` : '-',
      r.satisfaction !== null ? `${r.satisfaction}星` : '-',
      r.attemptDate || '-'
    ]);
    
    // Add UTF-8 BOM prefix (\uFEFF) for Excel compatibility with traditional Chinese characters
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `盛餘AI_HRD_員工學習進度報表_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered course options for multi-select dropdown based on category
  const availableCoursesForFilter = useMemo(() => {
    return courses.filter(c => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (courseSearchTerm && !c.title.toLowerCase().includes(courseSearchTerm.toLowerCase())) return false;
      return true;
    });
  }, [courses, selectedCategory, courseSearchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">員工學習狀況查詢</h1>
          <p className="text-slate-600 text-sm mt-1">追蹤各部門與個別同仁在線上課程的點閱、測驗以及問卷滿意度記錄。</p>
        </div>
        <button 
          onClick={handleExportCSV} 
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Download className="h-4 w-4" /> 匯出篩選結果 (CSV)
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-1">
          <ListFilter className="h-4 w-4 text-brand-600" /> 進階篩選與搜尋
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋員工、工號或課程"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">所有部門 (全選)</option>
              {departments.filter(d => d !== 'All').map((d, idx) => (
                <option key={d || idx} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-xl p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">所有課程分類</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Course Multi-select Dropdown */}
          <div className="relative" ref={courseDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCourseDropdownOpen(prev => !prev)}
              className="w-full border border-gray-300 rounded-xl p-2 text-xs bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <span className="truncate text-slate-700">
                {selectedCourses.length === 0 
                  ? '所有課程 (複選)' 
                  : `已選 ${selectedCourses.length} 堂課程`}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" />
            </button>

            {isCourseDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-3 w-72 md:w-80">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                  <span className="text-xs font-bold text-slate-800">選擇課程 (支援複選)</span>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setSelectedCourses(availableCoursesForFilter.map(c => c.id))}
                      className="text-[11px] text-brand-600 font-bold hover:underline"
                    >
                      全選
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedCourses([])}
                      className="text-[11px] text-slate-400 font-medium hover:underline"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="搜尋課程名稱..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-1.5 text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableCoursesForFilter.map(c => {
                    const isChecked = selectedCourses.includes(c.id);
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${isChecked ? 'bg-brand-50 text-brand-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedCourses(prev => 
                              isChecked ? prev.filter(id => id !== c.id) : [...prev, c.id]
                            );
                          }}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="truncate flex-1">{c.title}</span>
                      </label>
                    );
                  })}
                  {availableCoursesForFilter.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">查無符合課程</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">所有上課狀態</option>
              <option value="已完成">已完成</option>
              <option value="進行中">進行中</option>
              <option value="未通過測驗">未通過測驗</option>
              <option value="尚未開始">尚未開始</option>
            </select>
          </div>
        </div>

        {/* Selected Course Chips */}
        {selectedCourses.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 font-medium mr-1">已選課程：</span>
            {selectedCourses.map(id => {
              const c = courses.find(item => item.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                  {c?.title || id}
                  <button 
                    onClick={() => setSelectedCourses(prev => prev.filter(item => item !== id))}
                    className="hover:text-brand-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            <button 
              onClick={() => setSelectedCourses([])} 
              className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-2"
            >
              全部清除
            </button>
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex border-t border-gray-100 pt-4 gap-2">
          <button
            onClick={() => setViewMode('flat')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${viewMode === 'flat' ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
          >
            明細表檢視
          </button>
          <button
            onClick={() => setViewMode('by-user')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${viewMode === 'by-user' ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
          >
            依員工分組
          </button>
          <button
            onClick={() => setViewMode('by-course')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${viewMode === 'by-course' ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
          >
            依課程分組
          </button>
        </div>
      </div>

      {/* Flat List View */}
      {viewMode === 'flat' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-6 py-4">員工編號 / 姓名</th>
                  <th className="px-6 py-4">部門</th>
                  <th className="px-6 py-4">課程名稱</th>
                  <th className="px-6 py-4">類別</th>
                  <th className="px-6 py-4">上課狀態</th>
                  <th className="px-6 py-4">測驗分數</th>
                  <th className="px-6 py-4">滿意度</th>
                  <th className="px-6 py-4">更新日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-slate-700 bg-white">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block">{r.userName}</span>
                        <span className="text-xs text-gray-500 block">{r.employeeId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{r.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{r.courseTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                          {r.courseCategory}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${r.statusColor}`}>
                          {r.statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold">
                        {r.quizScore !== null ? (
                          <span className={r.quizScore >= 60 ? 'text-green-600' : 'text-red-500'}>{r.quizScore}分</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-amber-500 font-semibold">
                        {r.satisfaction !== null ? `${r.satisfaction} ★` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{r.attemptDate || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">沒有符合篩選條件的學習記錄。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grouped by User View */}
      {viewMode === 'by-user' && (
        <div className="space-y-6">
          {recordsGroupedByUser.length > 0 ? (
            recordsGroupedByUser.map(group => (
              <div key={group.user.employeeId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-100 p-2 rounded-full text-brand-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{group.user.name} ({group.user.employeeId})</h3>
                      <p className="text-xs text-slate-500">{group.user.department} | {group.user.title}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 bg-white border border-gray-200 px-3 py-1 rounded-full font-medium self-start md:self-auto">
                    已點閱課程數：{group.records.filter(r => r.statusText !== '尚未開始').length} / {group.records.length}
                  </div>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white text-slate-400 text-xs font-bold uppercase border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">課程名稱</th>
                      <th className="px-6 py-3">類別</th>
                      <th className="px-6 py-3">狀態</th>
                      <th className="px-6 py-3">測驗分數</th>
                      <th className="px-6 py-3">滿意度</th>
                      <th className="px-6 py-3">最後上課日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm text-slate-700">
                    {group.records.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-slate-900">{r.courseTitle}</td>
                        <td className="px-6 py-3.5">{r.courseCategory}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${r.statusColor}`}>
                            {r.statusText}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold">
                          {r.quizScore !== null ? (
                            <span className={r.quizScore >= 60 ? 'text-green-600' : 'text-red-500'}>{r.quizScore}分</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-3.5 text-amber-500 font-semibold">{r.satisfaction !== null ? `${r.satisfaction} ★` : '-'}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-500">{r.attemptDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-gray-200 shadow-sm font-medium">沒有符合篩選條件的學習記錄。</div>
          )}
        </div>
      )}

      {/* Grouped by Course View */}
      {viewMode === 'by-course' && (
        <div className="space-y-6">
          {recordsGroupedByCourse.length > 0 ? (
            recordsGroupedByCourse.map((group, idx) => (
              <div key={group.records[0]?.courseId || idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{group.course.title}</h3>
                      <p className="text-xs text-slate-500">課程類別：{group.course.category} | {group.course.type === 'compulsory' ? '推薦必修' : '選修'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 bg-white border border-gray-200 px-3 py-1 rounded-full font-medium self-start md:self-auto">
                    參與率：{group.records.filter(r => r.statusText !== '尚未開始').length} / {group.records.length} 名員工
                  </div>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white text-slate-400 text-xs font-bold uppercase border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">員工編號 / 姓名</th>
                      <th className="px-6 py-3">部門</th>
                      <th className="px-6 py-3">上課狀態</th>
                      <th className="px-6 py-3">測驗分數</th>
                      <th className="px-6 py-3">滿意度</th>
                      <th className="px-6 py-3">最後上課日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm text-slate-700">
                    {group.records.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-slate-900">{r.userName}</span>
                          <span className="text-xs text-gray-500 ml-1">({r.employeeId})</span>
                        </td>
                        <td className="px-6 py-3.5">{r.department}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${r.statusColor}`}>
                            {r.statusText}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold">
                          {r.quizScore !== null ? (
                            <span className={r.quizScore >= 60 ? 'text-green-600' : 'text-red-500'}>{r.quizScore}分</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-3.5 text-amber-500 font-semibold">{r.satisfaction !== null ? `${r.satisfaction} ★` : '-'}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-500">{r.attemptDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-gray-200 shadow-sm font-medium">沒有符合篩選條件的學習記錄。</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLearningRecords;
