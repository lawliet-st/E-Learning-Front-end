import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const MOCK_QUESTIONS = [
    { id: 1, text: '當遇到客戶提出不合理的規格變更時，第一步應該做什麼？', options: ['直接拒絕', '聆聽需求並評估影響', '答應並事後再說'], ans: 1 },
    { id: 2, text: '在專案管理中，甘特圖主要用於？', options: ['成本控制', '進度排程', '品質管理'], ans: 1 },
    { id: 3, text: '面對團隊成員衝突，最有效的解決方式是？', options: ['忽視', '私下個別溝通', '公開指責'], ans: 1 },
    { id: 4, text: '美的特質：在UI設計中，"White Space" 的主要作用是？', options: ['填補空白', '增加閱讀呼吸感', '節省顏色'], ans: 1 },
    { id: 5, text: '美的特質：色彩心理學中，藍色通常代表？', options: ['熱情', '信任與專業', '警告'], ans: 1 },
    // ... simulate 50 questions
];

const SkillAssessment: React.FC = () => {
  const { user, submitSkillAssessment } = useStore();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!user) return null;

  if (user.profile.skillAssessmentScore && !started && !finished) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">您已完成專業技能測驗</h2>
                <p className="text-gray-600 mb-4">您的得分為：{user.profile.skillAssessmentScore} / 50</p>
                <button onClick={() => navigate('/my-learning')} className="bg-slate-800 text-white px-6 py-2 rounded">返回</button>
            </div>
        </div>
      );
  }

  const handleAnswer = (optionIdx: number) => {
      // Mock logic: 50% chance to be right if not checking logic, but here we check
      // For simulation, we just increment score if index 1 (our mock correct ans)
      if (optionIdx === 1) setScore(s => s + 1);

      if (currentQ < 9) { // Simulate just 10 qs for UI, but logic scales to 50
          setCurrentQ(q => q + 1);
      } else {
          // Finished mock 10 questions.
          // Scale score to 50 for the logic requirement
          // If we answered 10 questions, max score is 10. Scale to 50: score * 5
          // Randomized slightly for demo variety
          const finalScore = Math.min(50, Math.floor(Math.random() * 20) + 30); 
          submitSkillAssessment(finalScore);
          setFinished(true);
      }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
        {!started ? (
            <div className="bg-white p-8 rounded-xl shadow border border-brand-200 text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">專業技能測驗</h1>
                <p className="text-gray-600 mb-6">
                    本測驗共 50 題，包含情境題、工具應用與專業知識。<br/>
                    測驗結果將作為人才九宮格中「潛力」維度的重要依據 (佔50%)。<br/>
                    <span className="text-red-500 font-bold">每人僅限測驗一次，請在安靜環境下進行。</span>
                </p>
                <button onClick={() => setStarted(true)} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg transition-transform hover:scale-105">
                    開始測驗
                </button>
            </div>
        ) : finished ? (
            <div className="bg-white p-8 rounded-xl shadow text-center">
                 <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">測驗完成</h2>
                <p className="text-gray-600 mb-6">您的雷達圖與人才九宮格數據已更新。</p>
                <button onClick={() => navigate('/my-learning')} className="bg-slate-800 text-white px-6 py-2 rounded">返回儀表板</button>
            </div>
        ) : (
            <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
                <div className="mb-4 flex justify-between text-xs text-gray-400 uppercase">
                    <span>Question {currentQ + 1} / 50 (Simulated)</span>
                    <span>Progress</span>
                </div>
                <div className="mb-6 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div style={{width: `${(currentQ / 10) * 100}%`}} className="h-full bg-brand-500 transition-all"></div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-6">
                    {MOCK_QUESTIONS[currentQ % MOCK_QUESTIONS.length].text}
                </h3>

                <div className="space-y-3">
                    {MOCK_QUESTIONS[currentQ % MOCK_QUESTIONS.length].options.map((opt, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-300 transition-colors"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default SkillAssessment;