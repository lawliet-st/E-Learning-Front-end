import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { AlertCircle, CheckCircle, XCircle, Star } from 'lucide-react';

const Quiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { courses, submitQuiz } = useStore();
  const navigate = useNavigate();
  
  const course = courses.find(c => c.id === id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [step, setStep] = useState<'quiz' | 'survey' | 'result'>('quiz');
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  if (!course) return <div>找不到課程</div>;

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (result) return; 
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleQuizSubmit = () => {
    let correctCount = 0;
    course.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const score = Math.round((correctCount / course.questions.length) * 100);
    const passed = score >= 60;
    
    setResult({ score, passed });
    setStep('survey');
  };

  const handleFinalSubmit = () => {
      if (!result) return;
      submitQuiz(course.id, result.score, satisfaction);
      setStep('result');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">課程測驗: {course.title}</h1>
          <p className="text-slate-400 mt-1">請回答所有問題以完成課程。</p>
        </div>

        <div className="p-8 space-y-8">
          {step === 'result' && result ? (
            <div className={`text-center p-8 rounded-xl border-2 ${result.passed ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
              <div className="flex justify-center mb-4">
                {result.passed ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{result.score}分</h2>
              <p className={`text-lg font-medium mb-6 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                {result.passed ? '恭喜您通過測驗！' : '分數未達標準，請複習後再試一次。'}
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/my-learning')}
                  className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                >
                  返回我的學習
                </button>
                {!result.passed && (
                  <button
                    onClick={() => { setResult(null); setAnswers({}); setStep('quiz'); setSatisfaction(0); }}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    重考
                  </button>
                )}
              </div>
            </div>
          ) : step === 'survey' ? (
              <div className="text-center animate-fade-in">
                  <h3 className="text-xl font-bold mb-4">課程滿意度調查</h3>
                  <p className="text-gray-600 mb-6">請為本課程的內容與品質評分 (1-5星)</p>
                  
                  <div className="flex justify-center gap-2 mb-8">
                      {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => setSatisfaction(star)} className="focus:outline-none transition-transform hover:scale-110">
                              <Star className={`h-10 w-10 ${satisfaction >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          </button>
                      ))}
                  </div>

                  <button
                    onClick={handleFinalSubmit}
                    disabled={satisfaction === 0}
                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white text-lg font-bold py-4 rounded-xl shadow-md transition-colors"
                  >
                    提交結果
                  </button>
              </div>
          ) : (
            <>
              {course.questions.map((q, idx) => (
                <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <p className="font-semibold text-lg text-slate-800 mb-4">
                    <span className="text-slate-400 mr-2">{idx + 1}.</span>
                    {q.text}
                  </p>
                  <div className="space-y-3">
                    {q.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionSelect(q.id, i)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          answers[q.id] === i
                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="inline-block w-6 font-medium text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-6">
                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(answers).length !== course.questions.length}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-md transition-colors"
                >
                  下一步
                </button>
                {Object.keys(answers).length !== course.questions.length && (
                  <p className="text-center text-sm text-slate-500 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="h-4 w-4" /> 請回答所有問題
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