import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { FileText, Play, MessageSquare, Sparkles, Lock, Unlock, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { courses, getCourseProgress } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video');

  // Video Lock & AFK Logic
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAfkModal, setShowAfkModal] = useState(false);
  const [isUnlockedManually, setIsUnlockedManually] = useState(false);
  const [showUnlockConfirmModal, setShowUnlockConfirmModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityTime = useRef(Date.now());
  const isAfkRef = useRef(false);

  const course = courses.find(c => c.id === id);
  const progress = id ? getCourseProgress(id) : undefined;

  const isNativeVideo = course?.videoUrl?.startsWith('/uploads') || course?.videoUrl?.endsWith('.mp4');

  useEffect(() => {
    const handleActivity = () => { lastActivityTime.current = Date.now(); };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  useEffect(() => {
    if (course && !course.videoUrl) {
      setActiveTab('pdf');
    }
  }, [course]);

  const handleStartVideo = () => {
    setIsPlaying(true);
    isAfkRef.current = false;
    lastActivityTime.current = Date.now();
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        if (isAfkRef.current) return;
        // AFK Trigger after 3 minutes
        if (Date.now() - lastActivityTime.current > 3 * 60 * 1000) {
          isAfkRef.current = true;
          setShowAfkModal(true);
          setIsPlaying(false);
        } else {
          setTimeSpent(prev => prev + 1);
        }
      }, 1000);
    }
  };

  const handleResumeFromAfk = () => {
    setShowAfkModal(false);
    lastActivityTime.current = Date.now();
    isAfkRef.current = false;
    setIsPlaying(true);
  };

  if (!course) return <div className="p-8 text-center text-slate-600">找不到課程</div>;

  const durationSeconds = course.durationSeconds || 0;
  const canTakeQuiz = progress?.completed || isUnlockedManually || !course.videoUrl || timeSpent >= (durationSeconds / 2);
  const remainingSeconds = course.videoUrl ? Math.max(0, (durationSeconds / 2) - timeSpent) : 0;

  const handleConfirmUnlock = () => {
    setIsUnlockedManually(true);
    setShowUnlockConfirmModal(false);
    navigate(`/course/${course.id}/quiz`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-slate-500 hover:text-brand-600 mb-2 inline-block font-medium">&larr; 返回課程列表</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
            <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">
              {course.category}
            </span>
          </div>
          <p className="text-slate-600 mt-1 max-w-2xl">{course.description}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {progress?.completed ? (
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2.5 rounded-2xl font-bold border border-emerald-200 flex items-center gap-2 shadow-xs">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              課程已完成 (測驗分數: {progress.quizScore} 分)
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
              {canTakeQuiz ? (
                <button
                  onClick={() => navigate(`/course/${course.id}/quiz`)}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 animate-pulse"
                >
                  <Unlock className="h-4 w-4" /> 參加線上測驗
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-100 text-slate-500 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium">
                    <Lock className="h-3.5 w-3.5" />
                    <span>需觀看 50% ({Math.ceil(remainingSeconds / 60)} 分鐘後解鎖)</span>
                  </div>
                  
                  {/* 一鍵解鎖測驗按鈕 */}
                  <button
                    onClick={() => setShowUnlockConfirmModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    title="已有此技能，直接解鎖測驗"
                  >
                    <Zap className="h-3.5 w-3.5" /> 一鍵解鎖測驗
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {course.videoUrl && (
                <button
                  onClick={() => setActiveTab('video')}
                  className={`${activeTab === 'video' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Play className="h-4 w-4" /> 影音課程
                </button>
              )}
              <button
                onClick={() => setActiveTab('pdf')}
                className={`${activeTab === 'pdf' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <FileText className="h-4 w-4" /> 講義教材 (PDF)
              </button>
            </nav>
          </div>

          {/* Viewer */}
          <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video relative group">
            {activeTab === 'video' && course.videoUrl ? (
              <>
                {!isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <button
                      onClick={handleStartVideo}
                      className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-transform transform hover:scale-105 shadow-xl"
                    >
                      <Play className="h-6 w-6" /> 開始上課
                    </button>
                  </div>
                ) : isNativeVideo ? (
                  <video
                    src={course.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`${course.videoUrl}?autoplay=1`}
                    title={course.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
                {/* Fallback image if not playing */}
                {!isPlaying && (
                  <img src={course.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
              </>
            ) : course.pdfUrl ? (
              <div className="w-full h-full bg-slate-900 relative">
                <iframe
                  src={course.pdfUrl}
                  className="w-full h-full border-0"
                  title={`${course.title} - 講義教材`}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-500 p-8">
                <FileText className="h-16 w-16 mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">尚未上傳 PDF 講義</h3>
                <p className="text-sm">此課程目前未附帶線上 PDF 教材。</p>
              </div>
            )}
          </div>

          {isPlaying && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 flex items-center justify-between">
              <span>⏱️ 學習進度計時中... 系統正在自動記錄您的學習時數。</span>
              <span className="font-mono font-bold">已觀看：{Math.floor(timeSpent / 60)} 分 {timeSpent % 60} 秒</span>
            </div>
          )}
        </div>

        {/* Sidebar: AI Tutor (Temporarily Disabled / Coming Soon) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 h-full flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="font-bold text-slate-800">AI 課程家教</h2>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  暫不開放
                </span>
              </div>

              {/* Disabled Notice */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5 text-center space-y-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-purple-900">AI 助教功能升級中</h4>
                <p className="text-xs text-purple-700/80 leading-relaxed">
                  為提供更精準的企業內訓答疑與知識庫問答，AI 課程家教目前正進行模型微調升級，未來將於後續版本正式上線，敬請期待！
                </p>
              </div>
            </div>

            {/* Disabled Input */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <div className="relative opacity-60 pointer-events-none">
                <input
                  type="text"
                  disabled
                  placeholder="AI 家教功能暫未開放..."
                  className="w-full border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-xs bg-slate-100 cursor-not-allowed"
                />
                <button
                  disabled
                  className="absolute right-2 top-2.5 text-slate-400"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AFK Modal */}
      {showAfkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">閒置提醒</h3>
            <p className="text-gray-600 text-xs leading-relaxed mb-6">您已經超過 3 分鐘沒有任何動作，系統已自動暫停學習進度計時與播放，請點擊下方按鈕繼續上課。</p>
            <button
              onClick={handleResumeFromAfk}
              className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-all shadow-md text-sm"
            >
              我還在，繼續上課
            </button>
          </div>
        </div>
      )}

      {/* 一鍵解鎖測驗確認 Modal */}
      {showUnlockConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full animate-fade-in">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">確認直接解鎖測驗？</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              若您已具備本課程相關專業知識與實務經驗，可跳過課程影音進度直接進行測驗。<br/><br/>
              <strong>重要注意事項：</strong><br/>
              • 測驗需達到 <strong>{course.passScore || 70} 分</strong> 方為及格通過。<br/>
              • 若連續測驗 3 次未通過，系統將啟動冷卻限制機制。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnlockConfirmModal(false)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                返回繼續上課
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-md"
              >
                確認解鎖並進入測驗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;