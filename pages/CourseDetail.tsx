import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { FileText, Play, MessageSquare, Sparkles, Lock, Clock } from 'lucide-react';
import { askAiTutor } from '../services/gemini';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { courses, getCourseProgress } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Video Lock & AFK Logic
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAfkModal, setShowAfkModal] = useState(false);
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
    // Start tracking time
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

  const handlePauseVideo = () => {
    // In a real iframe integration (e.g. YouTube API), we would pause here.
    // For this simulated "Start Video" button overlay, we just start it once.
  }

  if (!course) return <div>找不到課程</div>;

  const durationSeconds = course.durationSeconds || 0;
  const canTakeQuiz = progress?.completed || !course.videoUrl || timeSpent >= (durationSeconds / 2);
  const remainingSeconds = course.videoUrl ? Math.max(0, (durationSeconds / 2) - timeSpent) : 0;

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiAnswer(null);
    const answer = await askAiTutor(course.id, course.title, aiQuestion);
    setAiAnswer(answer);
    setAiLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-slate-500 hover:text-brand-600 mb-2 inline-block">&larr; 返回課程列表</Link>
          <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
          <p className="text-slate-600 mt-1">{course.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {progress?.completed ? (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium border border-green-200">
              課程已完成 (測驗分數: {progress.quizScore}%)
            </div>
          ) : (
            <>
              {canTakeQuiz ? (
                <button
                  onClick={() => navigate(`/course/${course.id}/quiz`)}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors animate-pulse"
                >
                  參加測驗
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg border border-gray-200 cursor-not-allowed">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">請完成 50% 課程後解鎖測驗</span>
                </div>
              )}
              {!canTakeQuiz && (
                <p className="text-xs text-orange-600 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  還需觀看 {Math.ceil(remainingSeconds / 60)} 分鐘
                </p>
              )}
            </>
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
          <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video relative group">
            {activeTab === 'video' && course.videoUrl ? (
              <>
                {!isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <button
                      onClick={handleStartVideo}
                      className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-transform transform hover:scale-105"
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
                {/* Fallback image if not playing to look nice underneath */}
                {!isPlaying && (
                  <img src={course.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
              </>
            ) : (
              <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-500 p-8">
                <FileText className="h-16 w-16 mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">PDF 閱讀器模擬</h3>
                <p className="text-sm">在真實環境中，此處將顯示 PDF 內容。</p>
                <a href={course.pdfUrl} target="_blank" rel="noreferrer" className="mt-4 text-brand-600 hover:underline">下載教材</a>
              </div>
            )}
          </div>

          {isPlaying && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800 text-center">
              學習計時中... 系統正在記錄您的學習時數。
            </div>
          )}
        </div>

        {/* Sidebar: AI Tutor */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="font-bold text-slate-800">AI 課程家教</h2>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              <p className="text-sm text-slate-600 bg-gray-50 p-3 rounded-lg">
                你好！我是 <strong>{course.title}</strong> 的 AI 助教。對於課程內容有任何疑問都可以問我！
              </p>
              {aiAnswer && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <p className="text-sm text-slate-800">{aiAnswer}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAiAsk} className="mt-auto">
              <div className="relative">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="例如：這個單元的重點是什麼？"
                  className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={aiLoading}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="absolute right-2 top-2 text-brand-600 hover:text-brand-800 disabled:opacity-50"
                >
                  {aiLoading ? <div className="animate-spin h-5 w-5 border-2 border-brand-600 border-t-transparent rounded-full" /> : <MessageSquare className="h-5 w-5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showAfkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">閒置提醒</h3>
            <p className="text-gray-600 mb-6">您已經超過 3 分鐘沒有任何動作，系統已自動暫停學習進度計時與播放，請點擊下方按鈕繼續上課。</p>
            <button
              onClick={handleResumeFromAfk}
              className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700"
            >
              我還在，繼續上課
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;