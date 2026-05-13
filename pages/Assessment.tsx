import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ClipboardList } from 'lucide-react';

// Mock questions for the 3-in-1 simulation
const STEPS = [
  { id: 'intro', title: '測評說明', desc: '本測驗包含三個部分：HPI (性格), HDS (發展阻礙), MVPI (動機價值)。' },
  { id: 'hpi', title: 'Part 1: HPI 性格測驗', desc: '請根據您的日常行為作答 (模擬)' },
  { id: 'hds', title: 'Part 2: HDS 壓力應對', desc: '請根據您在壓力下的反應作答 (模擬)' },
  { id: 'mvpi', title: 'Part 3: MVPI 動機價值', desc: '請選擇您最重視的工作價值觀 (模擬)' },
  { id: 'processing', title: '分析中', desc: '系統正在計算您的潛力光譜...' },
  { id: 'done', title: '完成', desc: '測評已完成' }
];

const Assessment: React.FC = () => {
  const { user, completeAssessment } = useStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  if (!user) return null;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // If moving to processing (index 4), auto-complete after delay
      if (currentStep + 1 === 4) {
        setTimeout(() => {
          // Mock random scores for demo
          const scores = {
            hpi: Math.floor(Math.random() * 40) + 60, // 60-100
            hds: Math.floor(Math.random() * 60) + 20, // 20-80
            mvpi: Math.floor(Math.random() * 40) + 60, // 60-100
            completed: true
          };
          completeAssessment(scores);
          setCurrentStep(5);
        }, 2000);
      }
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          <ClipboardList className="h-12 w-12 text-white mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">人才潛力綜合測評</h1>
          <p className="text-indigo-200">Hogan Personality Inventory Suite</p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-xs font-semibold text-gray-500 tracking-wide uppercase">
              <span>進度</span>
              <span>{Math.round((currentStep / (STEPS.length - 1)) * 100)}%</span>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100">
              <div style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h2>
            <p className="text-gray-600">{step.desc}</p>
          </div>

          {step.id === 'done' ? (
             <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
                   <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <p className="mb-6 text-gray-600">您的報告已生成並整合至個人檔案。</p>
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                >
                  查看完整報告
                </button>
             </div>
          ) : step.id === 'processing' ? (
             <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
             </div>
          ) : (
            <div className="space-y-4">
              {/* Mock Form Content */}
              {step.id !== 'intro' && (
                <div className="space-y-3 animate-pulse">
                   <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                   <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                   <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
                   <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
                   <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
                </div>
              )}
              
              <button
                onClick={handleNext}
                className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors"
              >
                {step.id === 'intro' ? '開始測評' : '下一頁'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assessment;