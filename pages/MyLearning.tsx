import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import { Book, CheckCircle, Clock, ClipboardList, Target, AlertTriangle, Search, Filter, Sparkles, Award } from 'lucide-react';

const MyLearning: React.FC = () => {
  const { user, courses, getCourseProgress, categories } = useStore();
  const navigate = useNavigate();

  // Filters for "我的課程清單"
  const [listSearch, setListSearch] = useState('');
  const [listCategory, setListCategory] = useState('All');
  const [listType, setListType] = useState('All');
  const [listStatus, setListStatus] = useState('All');

  // Filters for "學習歷史動態"
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState('All');
  const [historyStatus, setHistoryStatus] = useState('All');

  if (!user) return null;

  const myCourses = courses.map(course => {
    const p = getCourseProgress(course.id);
    return { ...course, progress: p };
  });

  const completed = myCourses.filter(c => c.progress?.completed).length;

  // Filtered Course List
  const filteredCourseList = useMemo(() => {
    return myCourses.filter(c => {
      // Keyword search
      if (listSearch && !c.title.toLowerCase().includes(listSearch.toLowerCase())) {
        return false;
      }
      // Category filter
      if (listCategory !== 'All' && c.category !== listCategory) {
        return false;
      }
      // Type filter
      const isComp = c.type === 'compulsory' || (user && c.compulsoryTargets && (c.compulsoryTargets.departments?.includes(user.department) || c.compulsoryTargets.userIds?.includes(user.id)));
      if (listType === 'compulsory' && !isComp) return false;
      if (listType === 'elective' && isComp) return false;

      // Status filter
      let statusKey = 'not_started';
      if (c.progress?.completed) {
        statusKey = 'completed';
      } else if (c.progress && c.progress.quizScore !== null && c.progress.quizScore < (c.passScore || 70)) {
        statusKey = 'failed';
      } else if (c.progress) {
        statusKey = 'in_progress';
      }

      if (listStatus !== 'All' && statusKey !== listStatus) {
        return false;
      }

      return true;
    });
  }, [myCourses, listSearch, listCategory, listType, listStatus, user]);

  // Filtered History List
  const filteredHistoryList = useMemo(() => {
    return myCourses
      .filter(c => !!c.progress)
      .filter(c => {
        if (historySearch && !c.title.toLowerCase().includes(historySearch.toLowerCase())) {
          return false;
        }
        if (historyCategory !== 'All' && c.category !== historyCategory) {
          return false;
        }
        if (historyStatus === 'completed' && !c.progress?.completed) return false;
        if (historyStatus === 'in_progress' && c.progress?.completed) return false;
        if (historyStatus === 'failed' && (c.progress?.completed || (c.progress?.quizScore ?? 100) >= (c.passScore || 70))) return false;
        return true;
      });
  }, [myCourses, historySearch, historyCategory, historyStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">我的學習儀表板</h1>
          <p className="text-xs text-slate-500 mt-1">追蹤個人的線上訓練時數、測驗成果與能力成長指標。</p>
        </div>

        {/* Action button: Talent potential marked as coming soon */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button 
              type="button"
              onClick={() => alert('人才潛力評估功能目前配合系統升級維護暫不開放，敬請期待全新評測模組！')}
              className="flex items-center gap-2 bg-slate-100 text-slate-500 font-bold px-4 py-2.5 rounded-xl border border-slate-200 text-xs hover:bg-slate-200 transition-all cursor-pointer"
            >
              <ClipboardList className="h-4 w-4 text-slate-400" />
              <span>人才潛力評估 (暫不開放)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl">
            <Book className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">總課程數</p>
            <p className="text-2xl font-black text-slate-850 mt-0.5">{courses.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">已通過完成</p>
            <p className="text-2xl font-black text-slate-850 mt-0.5">{completed}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl">
            <Award className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">測驗平均成績</p>
            <p className="text-2xl font-black text-slate-850 mt-0.5">
              {completed > 0 
                ? Math.round(myCourses.filter(c => c.progress?.completed).reduce((acc, c) => acc + (c.progress?.quizScore || 0), 0) / completed) + ' 分' 
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. 我的課程清單 (With Dedicated Filter Bar) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            我的課程清單
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              共 {filteredCourseList.length} 堂
            </span>
          </h2>
        </div>

        {/* Course List Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋課程名稱..."
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <select
            value={listCategory}
            onChange={(e) => setListCategory(e.target.value)}
            className="border border-gray-200 rounded-xl p-2 text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">所有課程分類</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={listType}
            onChange={(e) => setListType(e.target.value)}
            className="border border-gray-200 rounded-xl p-2 text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">所有課程性質</option>
            <option value="compulsory">推薦 / 必修課程</option>
            <option value="elective">選修課程</option>
          </select>

          <select
            value={listStatus}
            onChange={(e) => setListStatus(e.target.value)}
            className="border border-gray-200 rounded-xl p-2 text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">所有修課狀態</option>
            <option value="completed">已完成通過</option>
            <option value="in_progress">進行中</option>
            <option value="failed">未通過測驗</option>
            <option value="not_started">尚未開始</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-6 py-3.5 text-left">課程名稱</th>
                <th className="px-6 py-3.5 text-left">類別</th>
                <th className="px-6 py-3.5 text-left">性質</th>
                <th className="px-6 py-3.5 text-left">上課進度 / 狀態</th>
                <th className="px-6 py-3.5 text-left">測驗分數</th>
                <th className="px-6 py-3.5 text-right">動作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredCourseList.map(c => {
                let statusLabel = '尚未開始';
                let statusColor = 'text-slate-500 bg-slate-100';
                
                if (c.progress?.completed) {
                  statusLabel = '已完成及格';
                  statusColor = 'text-emerald-700 bg-emerald-100';
                } else if (c.progress && c.progress.quizScore !== null && c.progress.quizScore < (c.passScore || 70)) {
                  statusLabel = '測驗未及格';
                  statusColor = 'text-rose-700 bg-rose-100';
                } else if (c.progress) {
                  statusLabel = '上課進行中';
                  statusColor = 'text-blue-700 bg-blue-100';
                }

                const isComp = c.type === 'compulsory' || (user && c.compulsoryTargets && (c.compulsoryTargets.departments?.includes(user.department) || c.compulsoryTargets.userIds?.includes(user.id)));

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 text-sm">
                      {c.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {c.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isComp ? (
                        <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          推薦/必修
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px]">
                          選修
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {c.progress?.quizScore !== null && c.progress?.quizScore !== undefined ? (
                        <span className={`font-mono font-bold ${c.progress.quizScore >= (c.passScore || 70) ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {c.progress.quizScore} 分
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                      <Link 
                        to={`/course/${c.id}`} 
                        className="bg-brand-50 hover:bg-brand-100 text-brand-700 px-3 py-1.5 rounded-xl transition-all inline-block"
                      >
                        {c.progress?.completed ? '複習課程' : '開始學習'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredCourseList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    查無符合條件的課程
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 學習歷史動態 (With Dedicated Filter Bar) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            學習歷史動態
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              共 {filteredHistoryList.length} 筆活動
            </span>
          </h2>
        </div>

        {/* History Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋歷史課程..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <select
            value={historyCategory}
            onChange={(e) => setHistoryCategory(e.target.value)}
            className="border border-gray-200 rounded-xl p-2 text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">所有分類</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={historyStatus}
            onChange={(e) => setHistoryStatus(e.target.value)}
            className="border border-gray-200 rounded-xl p-2 text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">所有動態狀態</option>
            <option value="completed">已及格完成</option>
            <option value="in_progress">進行中</option>
            <option value="failed">測驗未及格</option>
          </select>
        </div>

        {/* History List */}
        <div className="bg-white shadow-sm rounded-3xl border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100 text-xs">
            {filteredHistoryList.map(course => (
              <li key={course.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={course.thumbnail || 'https://picsum.photos/seed/default/100/60'} alt="" className="h-12 w-20 object-cover rounded-xl shadow-2xs hidden sm:block" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{course.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {course.category}
                        </span>
                        {course.progress?.completed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            及格通過
                          </span>
                        ) : course.progress?.quizScore !== null && (course.progress?.quizScore ?? 100) < (course.passScore || 70) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                            未達及格標準
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                            進行中
                          </span>
                        )}
                        {course.progress?.attemptDate && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            最後活動: {course.progress.attemptDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {course.progress?.quizScore !== undefined && course.progress.quizScore !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">測驗成績</p>
                        <p className={`font-black font-mono text-base ${course.progress.quizScore >= (course.passScore || 70) ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {course.progress.quizScore} 分
                        </p>
                      </div>
                    )}
                    <Link 
                      to={`/course/${course.id}`} 
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all"
                    >
                      前往
                    </Link>
                  </div>
                </div>
              </li>
            ))}
            {filteredHistoryList.length === 0 && (
              <li className="p-8 text-center text-slate-400">
                目前尚無符合篩選條件的學習紀錄
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyLearning;