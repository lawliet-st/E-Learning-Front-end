import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Trophy, TrendingUp, Star, Users, Download, Filter, X, Check, BookOpen, Calendar, ClipboardList } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { getAllUserMetrics, courses, progress, getDashboardStats } = useStore();
  const metrics = useMemo(() => getAllUserMetrics(), [getAllUserMetrics]);
  const dashboardStats = getDashboardStats();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showExportModal, setShowExportModal] = useState(false);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(courses.map(c => c.category || '未分類'));
    return ['all', ...Array.from(cats)];
  }, [courses]);

  // Filtered courses for stats
  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(c => (c.category || '未分類') === selectedCategory);

  // KPI Data
  const highPotentials = metrics.filter(m => m.isHighPotential);
  const topPerformers = metrics.slice(0, 5);
  const globalAverage = Math.round(metrics.reduce((acc, curr) => acc + curr.averageScore, 0) / (metrics.length || 1));

  // Chart Data
  const performanceChartData = metrics.map(m => ({
    name: m.userName.split(' ')[0], 
    score: m.averageScore,
    isHighPotential: m.isHighPotential
  }));

  // --- Export Logic ---
  const [exportFilters, setExportFilters] = useState({
    categories: [] as string[],
    dateStart: '',
    dateEnd: '',
    includeScore: true,
    includeSatisfaction: true,
    includeEmail: true,
  });

  const handleExport = () => {
    // Basic CSV Generation
    let header = "員工ID,姓名,部門,課程名稱,課程類別,完成日期";
    if (exportFilters.includeEmail) header += ",內部信箱";
    if (exportFilters.includeScore) header += ",分數";
    if (exportFilters.includeSatisfaction) header += ",滿意度";
    header += "\n";

    let csvContent = header;

    // Iterate through progress
    progress.forEach(p => {
        const user = metrics.find(m => m.userId === p.userId);
        const course = courses.find(c => c.id === p.courseId);
        if (!user || !course) return;

        // Apply filters
        if (exportFilters.categories.length > 0 && !exportFilters.categories.includes(course.category)) return;
        if (exportFilters.dateStart && p.attemptDate && new Date(p.attemptDate) < new Date(exportFilters.dateStart)) return;
        if (exportFilters.dateEnd && p.attemptDate && new Date(p.attemptDate) > new Date(exportFilters.dateEnd)) return;

        let row = `${user.userId},${user.userName},${user.department},${course.title},${course.category},${p.attemptDate?.split('T')[0] || ''}`;
        if (exportFilters.includeEmail) row += `,${user.internalEmail || ''}`;
        if (exportFilters.includeScore) row += `,${p.quizScore || 0}`;
        if (exportFilters.includeSatisfaction) row += `,${p.satisfaction || '-'}`;
        
        csvContent += row + "\n";
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '盛餘LMS_教育訓練數據.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const toggleExportCategory = (cat: string) => {
    setExportFilters(prev => {
        if (prev.categories.includes(cat)) {
            return { ...prev, categories: prev.categories.filter(c => c !== cat) };
        } else {
            return { ...prev, categories: [...prev.categories, cat] };
        }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">匯出數據設定</h3>
                    <button onClick={() => setShowExportModal(false)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">課程類別 (留空代表全部)</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.filter(c => c !== 'all').map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => toggleExportCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-xs border ${exportFilters.categories.includes(cat) ? 'bg-brand-100 border-brand-500 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">開始日期</label>
                            <input type="date" value={exportFilters.dateStart} onChange={(e) => setExportFilters({...exportFilters, dateStart: e.target.value})} className="w-full border border-gray-300 rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">結束日期</label>
                            <input type="date" value={exportFilters.dateEnd} onChange={(e) => setExportFilters({...exportFilters, dateEnd: e.target.value})} className="w-full border border-gray-300 rounded p-2" />
                        </div>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                         <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={exportFilters.includeScore} onChange={(e) => setExportFilters({...exportFilters, includeScore: e.target.checked})} />
                            包含測驗分數
                         </label>
                         <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={exportFilters.includeSatisfaction} onChange={(e) => setExportFilters({...exportFilters, includeSatisfaction: e.target.checked})} />
                            包含滿意度
                         </label>
                         <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={exportFilters.includeEmail} onChange={(e) => setExportFilters({...exportFilters, includeEmail: e.target.checked})} />
                            包含內部信箱
                         </label>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded flex items-center gap-2">
                        <Check className="h-4 w-4" /> 確認匯出
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">戰情室 (Dashboard)</h1>
           <p className="text-slate-600">組織績效總覽與人才識別。</p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Download className="h-4 w-4" /> 匯出數據 (Excel/CSV)
        </button>
      </div>

      {/* KPI Cards (Existing) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500 uppercase">組織平均分數</h3>
            <TrendingUp className="h-5 w-5 text-brand-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{globalAverage}%</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500 uppercase">高潛力人才</h3>
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{highPotentials.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500 uppercase">總員工數</h3>
            <Users className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{metrics.length}</p>
        </div>
      </div>

      {/* New KPI Cards (Monthly Stats) */}
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" /> 本月新增數據
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500 rounded-lg text-white"><BookOpen className="h-5 w-5" /></div>
                  <span className="font-bold text-blue-900">本月新增課程</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 ml-1">{dashboardStats.newCoursesThisMonth}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500 rounded-lg text-white"><ClipboardList className="h-5 w-5" /></div>
                  <span className="font-bold text-purple-900">本月新增測驗</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 ml-1">{dashboardStats.newQuizzesThisMonth}</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500 rounded-lg text-white"><Users className="h-5 w-5" /></div>
                  <span className="font-bold text-green-900">本月新加入員工</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 ml-1">{dashboardStats.newEmployeesThisMonth}</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Course Analytics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">課程分析數據</h3>
            <div className="flex gap-2">
                {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat 
                        ? 'bg-slate-800 text-white' 
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                >
                    {cat === 'all' ? '全部' : cat}
                </button>
                ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => {
                const courseProgress = progress.filter(p => p.courseId === course.id);
                const enrolled = courseProgress.length;
                const completed = courseProgress.filter(p => p.completed).length;
                const scores = courseProgress.map(p => p.quizScore || 0);
                
                // Score distribution for chart
                const scoreDist = [
                    { range: '0-59', count: scores.filter(s => s < 60).length },
                    { range: '60-79', count: scores.filter(s => s >= 60 && s < 80).length },
                    { range: '80-100', count: scores.filter(s => s >= 80).length },
                ];

                return (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:border-brand-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-slate-800 text-sm truncate pr-2" title={course.title}>{course.title}</h4>
                             <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 whitespace-nowrap">{course.category}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4 bg-slate-50 p-2 rounded">
                            <div>選課人數: <span className="font-bold text-slate-900">{enrolled}</span></div>
                            <div>完課人數: <span className="font-bold text-green-600">{completed}</span></div>
                        </div>
                        
                        <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreDist}>
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px'}} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                    <XAxis dataKey="range" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-1">分數分布</p>
                    </div>
                );
            })}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">員工績效概覽</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40}>
                  {performanceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isHighPotential ? '#8b5cf6' : '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-slate-900">績效排行榜 Top 5</h3>
             <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {topPerformers.map((user, idx) => (
              <Link to={`/profile/${user.userId}`} key={user.userId} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 group">
                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm mr-4 ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white text-slate-500 border border-gray-200'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-brand-600">{user.userName}</p>
                  <p className="text-xs text-slate-500">{user.department}</p>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-slate-900">{user.averageScore}%</span>
                  <span className="text-xs text-slate-400">{user.completedCoursesCount} 門課程</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;