import React from 'react';
import { useStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import { Book, CheckCircle, Clock, ClipboardList, Target, AlertTriangle } from 'lucide-react';

const MyLearning: React.FC = () => {
  const { user, courses, getCourseProgress } = useStore();
  const navigate = useNavigate();

  if (!user) return null;

  const myCourses = courses.map(course => {
    const p = getCourseProgress(course.id);
    return { ...course, progress: p };
  });

  // Only show courses that user has interacted with OR are compulsory
  // For the list table request: "All elective courses progress". 
  // Let's list ALL courses relevant to user.
  const courseList = myCourses;

  const completed = myCourses.filter(c => c.progress?.completed).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">我的學習儀表板</h1>
          <p className="text-slate-600 mt-1">追蹤您的學習進度與證書。</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => navigate('/skill-assessment')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${user.profile.skillAssessmentScore ? 'bg-green-600 text-white' : 'bg-red-500 text-white animate-pulse'}`}
            >
                <Target className="h-5 w-5" />
                <span>{user.profile.skillAssessmentScore ? '已完成技能測驗' : '進行專業技能測驗 (未完成)'}</span>
            </button>
            <button 
                onClick={() => navigate('/assessment')}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
                <ClipboardList className="h-5 w-5" />
                <span>{user.profile.assessment.completed ? '重新進行人才潛力測評' : '進行人才潛力分析測驗'}</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
             <Book className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">總課程數</p>
            <p className="text-2xl font-bold text-slate-800">{courses.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full">
             <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">已完成</p>
            <p className="text-2xl font-bold text-slate-800">{completed}</p>
          </div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-full">
             <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">平均分數</p>
            <p className="text-2xl font-bold text-slate-800">
              {completed > 0 
                ? Math.round(myCourses.reduce((acc, c) => acc + (c.progress?.quizScore || 0), 0) / completed) + '%' 
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {!user.profile.skillAssessmentScore && (
          <div className="mb-8 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 font-bold">提醒：您尚未完成專業技能測驗，這將影響您的人才九宮格分析結果。請盡速完成。</p>
          </div>
      )}

      {user.profile.assessment.completed && (
        <div className="mb-8 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
          <div>
            <h3 className="font-bold text-indigo-900">人才潛力分析已完成</h3>
            <p className="text-sm text-indigo-700">您已完成 Hogan HPI/HDS/MVPI 綜合測評，您可以前往個人檔案查看詳細分析。</p>
          </div>
          <Link to="/profile" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">查看報告 &rarr;</Link>
        </div>
      )}

      {/* New Course List Table */}
      <h2 className="text-xl font-bold text-slate-900 mb-4">我的課程清單</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">課程名稱</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">類別</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">性質</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分數</th>
                      <th className="px-6 py-3 text-right">動作</th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {courseList.map(c => {
                      let status = '尚未上課';
                      let statusColor = 'text-gray-500 bg-gray-100';
                      
                      if (c.progress?.completed) {
                          status = '已完成';
                          statusColor = 'text-green-700 bg-green-100';
                      } else if (c.progress && c.progress.quizScore !== null && c.progress.quizScore < 60) {
                          status = '未通過測驗';
                          statusColor = 'text-red-700 bg-red-100';
                      } else if (c.progress) {
                          status = '進行中';
                          statusColor = 'text-blue-700 bg-blue-100';
                      }

                      return (
                          <tr key={c.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{c.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.category}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.type === 'compulsory' ? '推薦' : '選修'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>{status}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.progress?.quizScore !== null && c.progress?.quizScore !== undefined ? `${c.progress.quizScore}分` : '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <Link to={`/course/${c.id}`} className="text-brand-600 hover:text-brand-900 font-medium">進入</Link>
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-4">學習歷史動態</h2>
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {myCourses.filter(c => c.progress).map(course => (
            <li key={course.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={course.thumbnail} alt="" className="h-12 w-20 object-cover rounded hidden sm:block" />
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {course.progress?.completed ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           已完成
                         </span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                           進行中
                         </span>
                      )}
                      {course.progress?.attemptDate && (
                        <span className="text-xs text-slate-500">
                          最後觀看: {new Date(course.progress.attemptDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {course.progress?.quizScore !== undefined && course.progress.quizScore !== null && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">分數</p>
                      <p className={`font-bold text-lg ${course.progress.quizScore >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        {course.progress.quizScore}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MyLearning;