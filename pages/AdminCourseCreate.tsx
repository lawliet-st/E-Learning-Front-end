import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Edit, X, Save, Sparkles, Image } from 'lucide-react';
import { Course, CourseType } from '../types';
import { generateCourseVisual } from '../services/gemini';

const AdminCourseManagement: React.FC = () => {
  const { courses, addCourse, updateCourse, deleteCourse, allUsers } = useStore();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [aiQuestionLoading, setAiQuestionLoading] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [uploadingState, setUploadingState] = useState<{video: boolean, pdf: boolean, image: boolean}>({video: false, pdf: false, image: false});

  const defaultCourse: Partial<Course> = {
    title: '',
    description: '',
    category: '未分類',
    type: 'elective',
    videoUrl: '',
    pdfUrl: '',
    duration: '60 分鐘',
    thumbnail: '',
    attributes: { logic: 50, professional: 50, difficulty: 50, importance: 50, knowledgeLimit: 50 },
    questions: [],
    visualSummary: '',
    compulsoryTargets: { departments: [], userIds: [] }
  };

  const [form, setForm] = useState<Partial<Course>>(defaultCourse);

  const startCreate = () => {
      setForm(defaultCourse);
      setIsEditing(true);
      setEditingId(null);
  }

  const startEdit = (course: Course) => {
      setForm({
          ...course,
          compulsoryTargets: course.compulsoryTargets || { departments: [], userIds: [] }
      });
      setIsEditing(true);
      setEditingId(course.id);
  };

  const handleDelete = (id: string) => {
      if(confirm('確定要刪除此課程嗎？')) {
          deleteCourse(id);
      }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      attributes: { ...form.attributes!, [e.target.name]: parseInt(e.target.value) }
    });
  };

  const handleGenerateVisual = async () => {
      if (!form.description) {
          alert('請先輸入課程描述');
          return;
      }
      setGenLoading(true);
      const svg = await generateCourseVisual(form.description);
      if (svg === "ERROR_INVALID_KEY") {
          alert('系統偵測到您的 Gemini API 金鑰無效或被設定為預設值！\n請開啟專案底下的 .env.local 檔案並填入真正的 API Key。如果您沒有金鑰，請至 Google AI Studio 免費申請。');
      } else if (svg) {
          setForm(prev => ({ ...prev, visualSummary: svg }));
      } else {
          alert('生成失敗，請稍後再試');
      }
      setGenLoading(false);
  };

  const handleAIGenerateQuestions = async () => {
      if (!form.pdfUrl || !form.pdfUrl.startsWith('/uploads/')) {
          alert('請先上傳 PDF 格式的講義檔案，才能使用 AI 出題功能！');
          return;
      }
      setAiQuestionLoading(true);
      try {
          const res = await fetch('/api/generate-questions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('nexus_token')}`
              },
              body: JSON.stringify({ pdfUrl: form.pdfUrl })
          });
          const data = await res.json();
          if (res.ok && data.response) {
              if (data.response === "ERROR_INVALID_KEY") {
                  alert('系統偵測到您的 Gemini API 金鑰無效或被設定為預設值！\n請開啟專案底下的 .env.local 檔案並填入真正的 API Key。');
                  return;
              }
              const newQuestions = JSON.parse(data.response);
              if (Array.isArray(newQuestions)) {
                  setForm(prev => ({
                      ...prev,
                      questions: newQuestions.map((q: any, idx: number) => ({
                          id: `q_ai_${idx}`,
                          text: q.text,
                          options: q.options,
                          correctAnswer: q.correctAnswer
                      }))
                  }));
              }
          } else {
              alert('AI 生成失敗，請確認講義內容或稍後再試。');
          }
      } catch (error) {
          console.error("Generate questions error:", error);
          alert('解析失敗，請稍後再試。');
      } finally {
          setAiQuestionLoading(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'videoUrl' | 'pdfUrl' | 'thumbnail') => {
      const file = e.target.files?.[0];
      if (!file) return;

      const typeKey = field === 'videoUrl' ? 'video' : field === 'pdfUrl' ? 'pdf' : 'image';
      setUploadingState(prev => ({ ...prev, [typeKey]: true }));

      const reader = new FileReader();
      reader.onload = async () => {
          const base64 = reader.result as string;
          try {
              const res = await fetch('/api/upload', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('nexus_token')}`
                  },
                  body: JSON.stringify({ filename: file.name, fileB64: base64 })
              });
              const data = await res.json();
              if (res.ok && data.url) {
                  setForm(prev => ({ ...prev, [field]: data.url }));
              } else {
                  alert('上傳失敗');
              }
          } catch (error) {
              console.error('Upload error', error);
              alert('上傳失敗');
          } finally {
              setUploadingState(prev => ({ ...prev, [typeKey]: false }));
          }
      };
      reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    if (editingId) {
        updateCourse({ 
          ...form as Course, 
          id: editingId,
          compulsoryTargets: form.compulsoryTargets || { departments: [], userIds: [] }
        });
    } else {
        const newCourse: Course = {
            ...form as Course,
            id: `c${Date.now()}`,
            createdAt: new Date().toISOString().split('T')[0],
            durationSeconds: form.durationSeconds !== undefined ? form.durationSeconds : 3600, 
            questions: form.questions?.length ? form.questions : [ 
                { id: 'q1', text: '基本測驗題', options: ['A','B','C'], correctAnswer: 0 }
            ],
            compulsoryTargets: form.compulsoryTargets || { departments: [], userIds: [] }
        };
        addCourse(newCourse);
    }
    setIsEditing(false);
  };

  if (isEditing) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">{editingId ? '編輯課程' : '新增教育訓練課程'}</h1>
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                <div>
                <label className="block text-sm font-medium text-gray-700">課程標題</label>
                <input name="title" required value={form.title} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">課程分類</label>
                        <select name="category" value={form.category} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option value="未分類">未分類</option>
                            <option value="職安衛">職安衛</option>
                            <option value="軟實力">軟實力</option>
                            <option value="IT技能">IT技能</option>
                            <option value="管理">管理</option>
                            <option value="行銷">行銷</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">課程性質</label>
                        <select name="type" value={form.type} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option value="elective">選修課程</option>
                            <option value="compulsory">推薦/必修課程</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">影片長度 (分鐘)</label>
                        <input
                            type="number"
                            name="durationMinutes"
                            min="0"
                            value={form.durationSeconds !== undefined ? Math.round(form.durationSeconds / 60) : 60}
                            onChange={(e) => {
                                const mins = parseInt(e.target.value) || 0;
                                setForm(prev => ({
                                    ...prev,
                                    duration: mins > 0 ? `${mins} 分鐘` : '無影片',
                                    durationSeconds: mins * 60
                                }));
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                </div>

                {/* 必修/推薦對象設定 */}
                <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-850">必修人員指派與篩選</h3>
                    <p className="text-xs text-gray-500 mt-0.5">您可以選擇本課程之必修/推薦對象，可直接點選部門快捷指派，或在下方單獨挑選人員。</p>
                  </div>
                  
                  {/* Department selectors */}
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">一鍵指派部門 (全體同仁必修)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Array.from(new Set(allUsers.filter(u => u.role === 'employee' && u.department).map(u => u.department))).map(dept => {
                        const isChecked = form.compulsoryTargets?.departments?.includes(dept);
                        return (
                          <label key={dept} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${isChecked ? 'bg-brand-50 border-brand-200 text-brand-700 font-semibold' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            <input 
                              type="checkbox"
                              checked={!!isChecked}
                              onChange={() => {
                                const depts = form.compulsoryTargets?.departments || [];
                                const newDepts = isChecked 
                                  ? depts.filter(d => d !== dept)
                                  : [...depts, dept];
                                setForm(prev => ({
                                  ...prev,
                                  compulsoryTargets: {
                                    departments: newDepts,
                                    userIds: prev.compulsoryTargets?.userIds || []
                                  }
                                }));
                              }}
                            />
                            {dept}
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => {
                          const allDepts = Array.from(new Set(allUsers.filter(u => u.role === 'employee' && u.department).map(u => u.department)));
                          setForm(prev => ({
                            ...prev,
                            compulsoryTargets: {
                              departments: allDepts,
                              userIds: prev.compulsoryTargets?.userIds || []
                            }
                          }));
                        }}
                        className="text-[10px] text-brand-600 hover:underline font-medium"
                      >
                        全選部門
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            compulsoryTargets: {
                              departments: [],
                              userIds: prev.compulsoryTargets?.userIds || []
                            }
                          }));
                        }}
                        className="text-[10px] text-gray-500 hover:underline font-medium"
                      >
                        清除部門
                      </button>
                    </div>
                  </div>

                  {/* Individual Users List with Search & Department filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">指派個別同仁 (支援跨部門搜尋)</label>
                    <input 
                      type="text" 
                      placeholder="輸入姓名、員工編號或部門快速搜尋..." 
                      value={searchUserQuery}
                      onChange={(e) => setSearchUserQuery(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white mb-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white text-xs">
                      {allUsers
                        .filter(u => u.role === 'employee')
                        .filter(u => {
                          if (!searchUserQuery) return true;
                          const q = searchUserQuery.toLowerCase();
                          return u.name.toLowerCase().includes(q) || 
                                 (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
                                 (u.department && u.department.toLowerCase().includes(q));
                        })
                        .map(u => {
                          const isChecked = form.compulsoryTargets?.userIds?.includes(u.id);
                          const isDeptChecked = form.compulsoryTargets?.departments?.includes(u.department);
                          return (
                            <label key={u.id} className={`flex items-center justify-between px-4 py-2 hover:bg-slate-50 cursor-pointer ${isDeptChecked ? 'bg-slate-50/50 opacity-80' : ''}`}>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox"
                                  disabled={isDeptChecked}
                                  checked={isDeptChecked || !!isChecked}
                                  onChange={() => {
                                    const ids = form.compulsoryTargets?.userIds || [];
                                    const newIds = isChecked
                                      ? ids.filter(id => id !== u.id)
                                      : [...ids, u.id];
                                    setForm(prev => ({
                                      ...prev,
                                      compulsoryTargets: {
                                        departments: prev.compulsoryTargets?.departments || [],
                                        userIds: newIds
                                      }
                                    }));
                                  }}
                                />
                                <span className="font-semibold text-slate-800">{u.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono">({u.employeeId})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{u.department} | {u.title}</span>
                                {isDeptChecked && <span className="text-[10px] text-brand-600 font-bold bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">已依部門指派</span>}
                              </div>
                            </label>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">課程描述</label>
                    <textarea name="description" rows={3} value={form.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>

                {/* AI Visual Generator */}
                <div className="border border-indigo-100 bg-indigo-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-indigo-900 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> AI 視覺化簡介圖表
                        </label>
                        {!editingId && ( // Allow regeneration if not saved (simplification) or always allow? Prompt says "immutable after publish". Assuming editingId means published.
                             <button 
                                type="button" 
                                onClick={handleGenerateVisual} 
                                disabled={genLoading || !form.description}
                                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                             >
                                 {genLoading ? '生成中...' : (form.visualSummary ? '重新生成' : '自動生成')}
                             </button>
                        )}
                    </div>
                    {form.visualSummary ? (
                        <div className="w-full h-48 bg-white rounded border border-gray-200 p-2 overflow-hidden flex items-center justify-center relative group">
                            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: form.visualSummary }} />
                            {editingId && <div className="absolute inset-0 bg-gray-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs text-white font-bold">已發布不可更改</div>}
                        </div>
                    ) : (
                        <div className="w-full h-24 border-2 border-dashed border-indigo-200 rounded flex flex-col items-center justify-center text-indigo-400 text-sm">
                            <Image className="h-6 w-6 mb-1" />
                            輸入描述後點擊生成
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">影片連結 / 上傳檔案</label>
                        <div className="mt-1 flex items-center gap-2">
                           <input name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="URL 或 上傳檔案" className="block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                           <label className={`cursor-pointer whitespace-nowrap bg-gray-100 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-200 ${uploadingState.video ? 'opacity-50 pointer-events-none' : ''}`}>
                               {uploadingState.video ? '上傳中...' : '選擇檔案'}
                               <input type="file" className="hidden" accept="video/mp4,video/webm" onChange={(e) => handleFileUpload(e, 'videoUrl')} />
                           </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">講義連結 (PDF)</label>
                        <div className="mt-1 flex items-center gap-2">
                           <input name="pdfUrl" value={form.pdfUrl} onChange={handleChange} placeholder="URL 或 上傳檔案" className="block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                           <label className={`cursor-pointer whitespace-nowrap bg-gray-100 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-200 ${uploadingState.pdf ? 'opacity-50 pointer-events-none' : ''}`}>
                               {uploadingState.pdf ? '上傳中...' : '選擇檔案'}
                               <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdfUrl')} />
                           </label>
                        </div>
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-gray-700">課程縮圖 (URL / 上傳圖片)</label>
                     <div className="mt-1 flex items-center gap-2">
                        <input name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="輸入圖片 URL 或上傳檔案" className="block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        <label className={`cursor-pointer whitespace-nowrap bg-gray-100 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-200 ${uploadingState.image ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploadingState.image ? '上傳中...' : '選擇檔案'}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumbnail')} />
                        </label>
                     </div>
                     <p className="text-xs text-gray-400 mt-1">若留空，系統將在課程列表以精緻的漸層與標題作為預設封面圖。</p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">能力指標設定 (0-100)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {key: 'logic', label: '邏輯思維'}, 
                            {key: 'professional', label: '專業技能'}, 
                            {key: 'difficulty', label: '難易度'}, 
                            {key: 'importance', label: '重要性'}, 
                            {key: 'knowledgeLimit', label: '知識門檻'}
                        ].map(attr => (
                            <div key={attr.key}>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{attr.label} ({attr.key})</label>
                                <input 
                                    type="range" 
                                    name={attr.key} 
                                    min="0" 
                                    max="100" 
                                    value={form.attributes![attr.key as keyof typeof form.attributes]} 
                                    onChange={handleAttributeChange}
                                    className="w-full"
                                />
                                <div className="text-right text-xs text-gray-400">{form.attributes![attr.key as keyof typeof form.attributes]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                        測驗題目設定 
                        <div className="flex gap-2">
                            <button type="button" onClick={handleAIGenerateQuestions} disabled={aiQuestionLoading} className="text-xs flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded disabled:opacity-50">
                                <Sparkles className="h-3 w-3" /> {aiQuestionLoading ? 'AI 解析 PDF 出題中...' : 'AI 閱讀講義自動出題'}
                            </button>
                            <button type="button" onClick={() => {
                                setForm(prev => ({
                                    ...prev, 
                                    questions: [...(prev.questions || []), {id: `q${Date.now()}`, text: '', options: ['',''], correctAnswer: 0}]
                                }));
                            }} className="text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700">
                                <PlusCircle className="h-3 w-3" /> 新增題目
                            </button>
                        </div>
                    </h3>
                    <div className="space-y-4">
                        {form.questions?.map((q, qIndex) => (
                            <div key={q.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 relative">
                                <button type="button" onClick={() => {
                                    setForm(prev => ({
                                        ...prev,
                                        questions: prev.questions?.filter((_, idx) => idx !== qIndex)
                                    }));
                                }} className="absolute right-2 top-2 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                
                                <div className="mb-3 pr-6">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">題目 {qIndex + 1}</label>
                                    <input value={q.text} onChange={(e) => {
                                        const newQs = [...(form.questions || [])];
                                        newQs[qIndex].text = e.target.value;
                                        setForm({...form, questions: newQs});
                                    }} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="請輸入題目內容" />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-700">選項設定 (請勾選正確解答)</label>
                                    {q.options.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                            <input type="radio" name={`correctAnswer_${q.id}`} checked={q.correctAnswer === optIndex} onChange={() => {
                                                const newQs = [...(form.questions || [])];
                                                newQs[qIndex].correctAnswer = optIndex;
                                                setForm({...form, questions: newQs});
                                            }} />
                                            <input value={opt} onChange={(e) => {
                                                const newQs = [...(form.questions || [])];
                                                newQs[qIndex].options[optIndex] = e.target.value;
                                                setForm({...form, questions: newQs});
                                            }} className="flex-1 border border-gray-300 rounded p-1 text-sm" placeholder={`選項 ${optIndex + 1}`} />
                                            <button type="button" onClick={() => {
                                                const newQs = [...(form.questions || [])];
                                                newQs[qIndex].options.splice(optIndex, 1);
                                                if(newQs[qIndex].correctAnswer >= newQs[qIndex].options.length) newQs[qIndex].correctAnswer = 0;
                                                setForm({...form, questions: newQs});
                                            }} className="text-gray-400 hover:text-red-500 text-xs px-1"><X className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        const newQs = [...(form.questions || [])];
                                        newQs[qIndex].options.push('');
                                        setForm({...form, questions: newQs});
                                    }} className="text-xs text-brand-600 hover:underline inline-block mt-1">+ 新增選項</button>
                                </div>
                            </div>
                        ))}
                        {(!form.questions || form.questions.length === 0) && (
                            <div className="text-center text-sm text-gray-500 py-4 border border-dashed border-gray-300 rounded">
                                目前沒有測驗題目，點擊上方按鈕新增。
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700">
                        <Save className="h-5 w-5" /> 儲存
                    </button>
                </div>
            </form>
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">課程管理</h1>
            <button onClick={startCreate} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700">
                <PlusCircle className="h-4 w-4" /> 新增課程
            </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">縮圖</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">課程名稱</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">類別</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">性質</th>
                        <th className="px-6 py-3 text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map(course => (
                        <tr key={course.id}>
                             <td className="px-6 py-4 whitespace-nowrap w-24">
                                 <img src={course.thumbnail} className="w-16 h-10 object-cover rounded" />
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                 {course.title}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                 {course.category}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                 {course.type === 'compulsory' ? '推薦/必修' : '選修'}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => startEdit(course)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit className="h-4 w-4"/></button>
                                <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default AdminCourseManagement;