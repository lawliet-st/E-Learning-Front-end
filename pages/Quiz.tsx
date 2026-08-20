import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { AlertCircle, CheckCircle, XCircle, Star, Clock, AlertTriangle, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { Question } from '../types';

const Quiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { courses, submitQuiz, getQuizCooldownStatus } = useStore();
  const navigate = useNavigate();
  
  const course = courses.find(c => c.id === id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [step, setStep] = useState<'quiz' | 'survey' | 'result'>('quiz');
  const [result, setResult] = useState<{ score: number; passed: boolean; failCount: number } | null>(null);

  // Cooldown countdown state
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Determine active questions and shuffled options for this session
  const processedQuestions = useMemo(() => {
    if (!course || !course.questions || course.questions.length === 0) return [];
    
    let qList = [...course.questions];
    
    // 1. Shuffle question order if isRandomOrder is true
    if (course.isRandomOrder) {
      qList = qList.sort(() => Math.random() - 0.5);
    }
    
    // 2. Pick 10 if isRandom10 is true (or if questions > 10 and default is random 10)
    let selectedQs = qList;
    if (course.isRandom10 && qList.length > 10) {
      const shuffled = [...qList].sort(() => Math.random() - 0.5);
      selectedQs = shuffled.slice(0, 10);
    }

    // 3. Shuffle options if isRandomOptions is true (default true)
    const shouldRandomOptions = course.isRandomOptions !== undefined ? course.isRandomOptions : true;

    return selectedQs.map(q => {
      const mappedOptions = q.options.map((opt, origIdx) => ({
        text: opt,
        originalIndex: origIdx
      }));

      const displayOptions = shouldRandomOptions 
        ? [...mappedOptions].sort(() => Math.random() - 0.5)
        : mappedOptions;

      return {
        ...q,
        displayOptions
      };
    });
  }, [course]);

  const activeQuestions = processedQuestions;

  // Check cooldown on mount and tick every second
  useEffect(() => {
    if (!course) return;
    const check = () => {
      const status = getQuizCooldownStatus(course.id);
      setCooldownRemaining(status.remainingSeconds);
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [course, getQuizCooldownStatus]);

  if (!course) return <div className="p-8 text-center text-slate-600">找不到課程</div>;

  const passThreshold = course.passScore !== undefined ? course.passScore : 70;
  const inCooldown = cooldownRemaining > 0;

  // Format seconds to mm:ss or hh:mm:ss
  const formatCooldown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hours > 0) {
      return `${hours} 小時 ${mins} 分 ${s} 秒`;
    }
    return `${mins} 分 ${s} 秒`;
  };

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (result || inCooldown) return; 
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleQuizSubmit = () => {
    let correctCount = 0;
    activeQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / activeQuestions.length) * 100);
    const passed = score >= passThreshold;
    
    setResult({ score, passed, failCount: 0 });
    setStep('survey');
  };

  const handleFinalSubmit = async () => {
    if (!result) return;
    const res = await submitQuiz(course.id, result.score, satisfaction);
    setResult(prev => prev ? { ...prev, failCount: res.failCount } : null);
    setStep('result');
  };

  // If in cooldown, block quiz and show countdown
  if (inCooldown && step === 'quiz') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-rose-100 text-center p-8 sm:p-12">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldAlert className="h-10 w-10 animate-bounce" />
          </div>
          <span className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 uppercase tracking-wide">
            測驗冷卻保護機制生效中
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-4 mb-2">請稍候再進行測驗</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-8">
            您已連續多次未達及格標準（{passThreshold} 分），系統為確保學習成效，已啟動防刷題冷卻限制。請利用這段時間再次複習課程教材與重點。
          </p>

          <div className="bg-slate-900 text-white rounded-2xl p-6 mb-8 max-w-sm mx-auto shadow-lg">
            <div className="text-xs text-slate-400 font-medium mb-1">冷卻剩餘時間</div>
            <div className="text-3xl font-mono font-bold text-amber-400 tracking-wider">
              {formatCooldown(cooldownRemaining)}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate(`/course/${course.id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> 返回複習教材
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              回課程列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-8 py-6 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-brand-500/30 text-brand-300 text-[10px] font-bold px-2 py-0.5 rounded border border-brand-400/30">
                線上測驗
              </span>
              <span className="text-xs text-slate-400 font-medium">及格標準：{passThreshold} 分</span>
            </div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              共 {activeQuestions.length} 題，每題 {Math.round(100 / activeQuestions.length)} 分
              {course.isRandom10 && <span className="ml-2 text-amber-300">（系統已由題庫隨機抽取 10 題）</span>}
            </p>
          </div>
          <button
            onClick={() => navigate(`/course/${course.id}`)}
            className="text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors"
          >
            返回課程
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* STEP 3: RESULT */}
          {step === 'result' && result ? (
            <div className={`text-center p-8 rounded-3xl border-2 animate-fade-in ${result.passed ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'}`}>
              <div className="flex justify-center mb-4">
                {result.passed ? (
                  <CheckCircle className="h-16 w-16 text-emerald-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-rose-500" />
                )}
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-1">{result.score} 分</h2>
              <div className="text-xs font-semibold text-slate-500 mb-4">及格標準：{passThreshold} 分</div>
              
              <p className={`text-base font-bold mb-4 ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                {result.passed ? '🎉 恭喜您通過本課程測驗！已完成課程修習。' : '很抱歉，成績未達及格標準，請複習教材後再次測驗。'}
              </p>

              {!result.passed && (
                <div className="max-w-md mx-auto bg-white/80 p-4 rounded-2xl border border-rose-200 text-xs text-slate-700 text-left leading-relaxed mb-6 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-600">
                    <AlertTriangle className="h-4 w-4" /> 測驗未通過提醒：
                  </div>
                  <p>• 當前未通過次數：<strong>{result.failCount} 次</strong></p>
                  {result.failCount === 3 && (
                    <p className="text-rose-600 font-bold">⚠️ 您已連續 3 次測驗未通過，系統已啟動 <strong>30 分鐘冷卻期</strong>，請於半小時後再試。</p>
                  )}
                  {result.failCount >= 4 && (
                    <p className="text-rose-600 font-bold">⚠️ 您已連續 {result.failCount} 次測驗未通過，系統已啟動 <strong>3 小時冷卻期</strong>，請詳細複習教材後再試。</p>
                  )}
                  {result.failCount < 3 && (
                    <p className="text-slate-500">提示：若連續測驗 3 次未通過，系統將啟動 30 分鐘冷卻限制。</p>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/my-learning')}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  前往我的學習儀表板
                </button>
                {!result.passed && !inCooldown && (
                  <button
                    onClick={() => { setResult(null); setAnswers({}); setStep('quiz'); setSatisfaction(0); }}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> 重新測驗
                  </button>
                )}
              </div>
            </div>
          ) : step === 'survey' ? (
            /* STEP 2: SATISFACTION SURVEY */
            <div className="text-center animate-fade-in py-4">
              <span className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1 rounded-full border border-brand-200">
                滿意度評價
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-3 mb-2">課程滿意度調查</h3>
              <p className="text-xs text-slate-500 mb-8 max-w-sm mx-auto">請為本課程的教學內容、實用性與測驗品質進行整體評分 (1-5星)</p>
              
              <div className="flex justify-center gap-3 mb-8">
                {[1,2,3,4,5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => setSatisfaction(star)} 
                    className="focus:outline-none transition-transform transform hover:scale-125 p-1"
                  >
                    <Star className={`h-10 w-10 ${satisfaction >= star ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-200 hover:text-slate-300'}`} />
                  </button>
                ))}
              </div>

              <div className="max-w-sm mx-auto">
                <button
                  onClick={handleFinalSubmit}
                  disabled={satisfaction === 0}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-2xl shadow-md transition-all"
                >
                  確認並送出測驗成果
                </button>
                {satisfaction === 0 && (
                  <p className="text-xs text-slate-400 mt-2">請先點擊上方星級評分以完成問卷</p>
                )}
              </div>
            </div>
          ) : (
            /* STEP 1: QUIZ QUESTIONS */
            <>
              {activeQuestions.map((q, idx) => (
                <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <p className="font-bold text-base text-slate-800 mb-3.5 flex items-start gap-2">
                    <span className="bg-slate-100 text-slate-700 text-xs font-mono px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <span>{q.text}</span>
                  </p>
                  <div className="space-y-2.5">
                    {q.displayOptions.map((optObj, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionSelect(q.id, optObj.originalIndex)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs font-medium ${
                          answers[q.id] === optObj.originalIndex
                            ? 'border-brand-500 bg-brand-50/80 text-brand-900 ring-2 ring-brand-500/20 font-bold'
                            : 'border-gray-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="inline-block w-6 font-mono font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span>
                        {optObj.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-gray-100">
                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(answers).length !== activeQuestions.length}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold py-4 rounded-2xl shadow-md transition-all"
                >
                  完成作答，進入滿意度調查 ({Object.keys(answers).length} / {activeQuestions.length})
                </button>
                {Object.keys(answers).length !== activeQuestions.length && (
                  <p className="text-center text-xs text-slate-500 mt-2 flex items-center justify-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> 還有 {activeQuestions.length - Object.keys(answers).length} 題尚未作答
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;