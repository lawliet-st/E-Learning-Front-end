import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Edit, X, Save, Sparkles, Image, Copy, Eye, Power, CheckCircle, AlertTriangle, HelpCircle, Shuffle, FolderPlus, History, Award, Users, Search, ChevronRight } from 'lucide-react';
import { Course, CourseType, CourseStatus } from '../types';

const AdminCourseManagement: React.FC = () => {
  const { 
    courses, addCourse, updateCourse, deleteCourse, duplicateCourse, setCourseStatus,
    allUsers, progress, categories, addCategory, updateCategory, deleteCategory 
  } = useStore();
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [uploadingState, setUploadingState] = useState<{video: boolean, pdf: boolean, image: boolean}>({video: false, pdf: false, image: false});

  // Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<{ id: number; name: string } | null>(null);

  const [historyModalCourse, setHistoryModalCourse] = useState<Course | null>(null);
  const [studentScoreModalCourse, setStudentScoreModalCourse] = useState<Course | null>(null);
  const [scoreSearchQuery, setScoreSearchQuery] = useState('');

  const defaultCourse: Partial<Course> = {
    title: '',
    description: '',
    category: categories[0]?.name || '職安衛',
    type: 'elective',
    status: 'draft',
    passScore: 70,
    isRandom10: true,
    isRandomOrder: false,
    isRandomOptions: true,
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
    setForm({
      ...defaultCourse,
      questions: Array.from({ length: 10 }).map((_, idx) => ({
        id: `q_${Date.now()}_${idx}`,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }))
    });
    setIsEditing(true);
    setEditingId(null);
  };

  const startEdit = (course: Course) => {
    setForm({
      ...course,
      passScore: course.passScore !== undefined ? course.passScore : 70,
      isRandom10: course.isRandom10 !== undefined ? course.isRandom10 : true,
      isRandomOrder: course.isRandomOrder !== undefined ? course.isRandomOrder : false,
      isRandomOptions: course.isRandomOptions !== undefined ? course.isRandomOptions : true,
      compulsoryTargets: course.compulsoryTargets || { departments: [], userIds: [] }
    });
    setIsEditing(true);
    setEditingId(course.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此課程嗎？這將一併移除相關題庫與設定。')) {
      await deleteCourse(id);
    }
  };

  const handleDuplicate = async (id: string) => {
    const dup = await duplicateCourse(id);
    if (dup) {
      alert(`已成功複製課程：《${dup.title}》，狀態為草稿。`);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const nextStatus: CourseStatus = course.status === 'published' ? 'closed' : 'published';
    const actionLabel = nextStatus === 'published' ? '開放' : '關閉';
    
    // Guard 10 questions before publishing
    if (nextStatus === 'published' && (!course.questions || course.questions.length < 10)) {
      alert(`開課失敗：正式開放課程題庫必須至少包含 10 道測驗題目（目前僅有 ${course.questions?.length || 0} 題）。\n請先編輯課程補足題目後再行開放。`);
      return;
    }

    if (confirm(`確定要將課程狀態切換為【${actionLabel}】嗎？`)) {
      const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const historyItem = {
        action: nextStatus === 'published' ? 'opened' as const : 'closed' as const,
        timestamp: nowStr,
        operator: '管理員'
      };
      const updatedHistory = [...(course.publishHistory || []), historyItem];
      await updateCourse({ ...course, status: nextStatus, publishHistory: updatedHistory });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      attributes: { ...form.attributes!, [e.target.name]: parseInt(e.target.value) }
    });
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

  // Save handler (as draft or published)
  const handleSave = async (publishDirectly: boolean) => {
    if (!form.title?.trim()) {
      alert('請填寫課程標題');
      return;
    }

    const questionCount = form.questions?.length || 0;

    // Rule: Must have >= 10 questions to publish directly
    if (publishDirectly && questionCount < 10) {
      alert(`開課失敗：正式開放課程必須至少包含 10 道測驗題目（目前僅有 ${questionCount} 題）。\n\n建議處置引導：\n1. 請於下方「測驗題目設定」繼續新增至 10 題以上。\n2. 或點選【儲存為草稿】，日後再補足題目後開放。`);
      return;
    }

    const targetStatus: CourseStatus = publishDirectly ? 'published' : 'draft';
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newHistoryItem = {
      action: publishDirectly ? 'opened' as const : 'draft_saved' as const,
      timestamp: nowStr,
      operator: '管理員'
    };

    if (editingId) {
      const existing = courses.find(c => c.id === editingId);
      const updatedHistory = [...(existing?.publishHistory || []), newHistoryItem];
      
      await updateCourse({ 
        ...form as Course, 
        id: editingId,
        status: targetStatus,
        publishHistory: updatedHistory,
        compulsoryTargets: form.compulsoryTargets || { departments: [], userIds: [] }
      });
    } else {
      const newCourse: Course = {
        ...form as Course,
        id: `c${Date.now()}`,
        status: targetStatus,
        createdAt: new Date().toISOString().split('T')[0],
        durationSeconds: form.durationSeconds !== undefined ? form.durationSeconds : 3600, 
        questions: form.questions || [],
        publishHistory: [newHistoryItem],
        compulsoryTargets: form.compulsoryTargets || { departments: [], userIds: [] }
      };
      await addCourse(newCourse);
    }

    setIsEditing(false);
  };

  // Category CRUD Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;
    await updateCategory(editingCat.id, editingCat.name.trim());
    setEditingCat(null);
  };

  if (isEditing) {
    const qCount = form.questions?.length || 0;
    const isMoreThan10 = qCount >= 10;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{editingId ? '編輯教育訓練課程' : '新增教育訓練課程'}</h1>
            <p className="text-xs text-slate-500 mt-0.5">完整設定課程資訊、指派對象、測驗題庫（需至少10題方可正式開放）與通過門檻。</p>
          </div>
          <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); }} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-8">
          {/* 基本資訊 */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-l-4 border-brand-600 pl-3">基本課程設定</h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">課程標題 <span className="text-red-500">*</span></label>
              <input 
                name="title" 
                required 
                placeholder="例如：職場工安與緊急避難演練" 
                value={form.title} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">課程分類</label>
                <select 
                  name="category" 
                  value={form.category} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-brand-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">課程性質</label>
                <select 
                  name="type" 
                  value={form.type} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="elective">選修課程</option>
                  <option value="compulsory">推薦 / 必修課程</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">及格分數 (分)</label>
                <input
                  type="number"
                  name="passScore"
                  min="0"
                  max="100"
                  value={form.passScore !== undefined ? form.passScore : 70}
                  onChange={(e) => setForm({ ...form, passScore: parseInt(e.target.value) || 70 })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">影片長度 (分鐘)</label>
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
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">課程詳細描述</label>
              <textarea 
                name="description" 
                rows={3} 
                value={form.description} 
                onChange={handleChange} 
                placeholder="請輸入本課程的學習目標、核心主題與適合對象..."
                className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-500" 
              />
            </div>
          </div>

          {/* 必修人員指派與篩選 */}
          <div className="border border-slate-200 bg-slate-50/80 p-5 rounded-2xl space-y-4">
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
                    <label key={dept} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${isChecked ? 'bg-brand-50 border-brand-200 text-brand-700 font-semibold' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
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

            {/* Individual Users List */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">指派個別同仁 (支援跨部門搜尋)</label>
              <input 
                type="text" 
                placeholder="輸入姓名、員工編號或部門快速搜尋..." 
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2 text-xs bg-white mb-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white text-xs">
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
                          <span className="text-[10px] text-gray-500 font-mono">({u.employeeId || u.id})</span>
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

          {/* AI 視覺化簡介圖表 (Temporarily disabled) */}
          <div className="border border-purple-100 bg-purple-50/60 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" /> AI 視覺化簡介圖表
              </label>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                暫不開放
              </span>
            </div>
            <p className="text-xs text-purple-700/80 leading-relaxed">
              AI 視覺化圖表自動生成功能目前配合系統升級暫停使用，後續版本將以全新引擎重新開放。
            </p>
          </div>

          {/* 影音與講義上傳 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">影片連結 / 上傳檔案</label>
              <div className="flex items-center gap-2">
                <input name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="YouTube 嵌入 URL 或上傳 mp4" className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500" />
                <label className={`cursor-pointer whitespace-nowrap bg-slate-100 px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 ${uploadingState.video ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingState.video ? '上傳中...' : '選擇檔案'}
                  <input type="file" className="hidden" accept="video/mp4,video/webm" onChange={(e) => handleFileUpload(e, 'videoUrl')} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">講義教材 (PDF)</label>
              <div className="flex items-center gap-2">
                <input name="pdfUrl" value={form.pdfUrl} onChange={handleChange} placeholder="PDF 檔案連結或上傳" className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500" />
                <label className={`cursor-pointer whitespace-nowrap bg-slate-100 px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 ${uploadingState.pdf ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingState.pdf ? '上傳中...' : '選擇檔案'}
                  <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdfUrl')} />
                </label>
              </div>
            </div>
          </div>

          {/* 封面縮圖 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">課程縮圖 (URL / 上傳圖片)</label>
            <div className="flex items-center gap-2">
              <input name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="輸入圖片 URL 或上傳封面圖" className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500" />
              <label className={`cursor-pointer whitespace-nowrap bg-slate-100 px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 ${uploadingState.image ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingState.image ? '上傳中...' : '選擇圖片'}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumbnail')} />
              </label>
            </div>
          </div>

          {/* 能力指標設定 (0-100) */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 border-l-4 border-brand-600 pl-3">能力五維指標設定 (0-100)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                {key: 'logic', label: '邏輯思維'}, 
                {key: 'professional', label: '專業技能'}, 
                {key: 'difficulty', label: '難易度'}, 
                {key: 'importance', label: '重要性'}, 
                {key: 'knowledgeLimit', label: '知識門檻'}
              ].map(attr => (
                <div key={attr.key} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                    <span>{attr.label}</span>
                    <span className="font-mono text-brand-600">{form.attributes![attr.key as keyof typeof form.attributes]}</span>
                  </div>
                  <input 
                    type="range" 
                    name={attr.key} 
                    min="0" 
                    max="100" 
                    value={form.attributes![attr.key as keyof typeof form.attributes]} 
                    onChange={handleAttributeChange}
                    className="w-full accent-brand-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 測驗題目設定與隨機出題控制 */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-l-4 border-brand-600 pl-3 flex items-center gap-2">
                  測驗題目設定
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${qCount >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    共 {qCount} 題 ({qCount >= 10 ? '符合開放開課門檻' : '尚不足 10 題'})
                  </span>
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setForm(prev => ({
                      ...prev, 
                      questions: [...(prev.questions || []), { id: `q_${Date.now()}`, text: '', options: ['', '', '', ''], correctAnswer: 0 }]
                    }));
                  }} 
                  className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> 新增題目
                </button>
              </div>
            </div>

            {/* AI 講義出題暫不開放說明 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI 閱讀講義自動出題：目前暫不開放
              </span>
              <span className="text-[10px] text-slate-400">請管理員直接於下方手動設定考題</span>
            </div>

            {/* 隨機出題與題序隨機控制區 */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Shuffle className="h-4 w-4 text-indigo-600" /> 測驗出題模式與配分設定
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 隨機選擇十題 Checkbox */}
                <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-indigo-100 cursor-pointer shadow-xs">
                  <input 
                    type="checkbox"
                    checked={!!form.isRandom10}
                    onChange={(e) => setForm({ ...form, isRandom10: e.target.checked })}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">隨機選擇十題測驗 (預設勾選)</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                      {form.isRandom10 
                        ? '✅ 啟用：學員測驗時由題庫隨機抽 10 題 (每題10分)。' 
                        : '⬜ 未勾選：題庫每題都考，由系統自動平均分配分數。'}
                    </span>
                  </div>
                </label>

                {/* 題目排序隨機 Checkbox */}
                <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-indigo-100 cursor-pointer shadow-xs">
                  <input 
                    type="checkbox"
                    checked={!!form.isRandomOrder}
                    onChange={(e) => setForm({ ...form, isRandomOrder: e.target.checked })}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">題目排序隨機 (打亂考題順序)</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                      {form.isRandomOrder 
                        ? '✅ 啟用：每位學員測驗時題目順序隨機排列。' 
                        : '⬜ 未勾選：依照題庫設定之原始順序展示。'}
                    </span>
                  </div>
                </label>

                {/* 選項排序隨機 Checkbox (預設勾選) */}
                <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-indigo-100 cursor-pointer shadow-xs">
                  <input 
                    type="checkbox"
                    checked={form.isRandomOptions !== undefined ? !!form.isRandomOptions : true}
                    onChange={(e) => setForm({ ...form, isRandomOptions: e.target.checked })}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">選項隨機排序 (預設勾選)</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                      {form.isRandomOptions !== false
                        ? '✅ 啟用：每道題目的選項 (A/B/C/D) 隨機打亂順序。' 
                        : '⬜ 未勾選：依據原始設定之選項順序呈現。'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {form.questions?.map((q, qIndex) => (
                <div key={q.id || qIndex} className="border border-gray-200 p-4 rounded-2xl bg-slate-50/50 relative shadow-2xs">
                  <button 
                    type="button" 
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        questions: prev.questions?.filter((_, idx) => idx !== qIndex)
                      }));
                    }} 
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-500 p-1 rounded-lg"
                    title="刪除此題"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="mb-3 pr-8">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      題目 {qIndex + 1}
                    </label>
                    <input 
                      value={q.text} 
                      onChange={(e) => {
                        const newQs = [...(form.questions || [])];
                        newQs[qIndex].text = e.target.value;
                        setForm({...form, questions: newQs});
                      }} 
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none" 
                      placeholder={`請輸入第 ${qIndex + 1} 題題目內容...`} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-500">選項設定 (請點選單選圓鈕設定正確答案)</label>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name={`correctAnswer_${q.id || qIndex}`} 
                          checked={q.correctAnswer === optIndex} 
                          onChange={() => {
                            const newQs = [...(form.questions || [])];
                            newQs[qIndex].correctAnswer = optIndex;
                            setForm({...form, questions: newQs});
                          }} 
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-xs font-mono font-bold text-slate-400 w-4">{String.fromCharCode(65 + optIndex)}.</span>
                        <input 
                          value={opt} 
                          onChange={(e) => {
                            const newQs = [...(form.questions || [])];
                            newQs[qIndex].options[optIndex] = e.target.value;
                            setForm({...form, questions: newQs});
                          }} 
                          className="flex-1 border border-gray-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none" 
                          placeholder={`選項 ${optIndex + 1} 內容`} 
                        />
                        {q.options.length > 2 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const newQs = [...(form.questions || [])];
                              newQs[qIndex].options.splice(optIndex, 1);
                              if(newQs[qIndex].correctAnswer >= newQs[qIndex].options.length) newQs[qIndex].correctAnswer = 0;
                              setForm({...form, questions: newQs});
                            }} 
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 5 && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const newQs = [...(form.questions || [])];
                          newQs[qIndex].options.push('');
                          setForm({...form, questions: newQs});
                        }} 
                        className="text-xs font-bold text-brand-600 hover:underline inline-block mt-1"
                      >
                        + 新增選項
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons: Save Draft vs Publish */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-slate-500 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-colors"
            >
              取消並返回
            </button>

            <div className="flex items-center gap-3">
              {/* Save Draft */}
              <button 
                type="button"
                onClick={() => handleSave(false)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-xs"
                title="儲存為草稿，未滿10題也可暫存"
              >
                <Save className="h-4 w-4 text-slate-600" /> 儲存為草稿 (暫存)
              </button>

              {/* Publish Course */}
              <button 
                type="button"
                onClick={() => handleSave(true)}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md"
              >
                <CheckCircle className="h-4 w-4" /> 正式開放課程 (需滿10題)
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">課程管理中心</h1>
          <p className="text-xs text-slate-500 mt-0.5">管理內部教育訓練課程、題庫設定、開放狀態切換、分類編輯與學員成績名冊查看。</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <FolderPlus className="h-4 w-4 text-brand-600" /> 分類設定管理
          </button>
          
          <button 
            onClick={startCreate} 
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
          >
            <PlusCircle className="h-4 w-4" /> 新增課程
          </button>
        </div>
      </div>
      
      {/* Course List Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">課程縮圖</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">課程名稱與分類</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">題目數 / 及格標準</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">狀態 / 開放管控</th>
              <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">操作功能</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 text-xs">
            {courses.map(course => {
              const qNum = course.questions?.length || 0;
              const isPub = course.status === 'published';
              const isClosed = course.status === 'closed';
              const isDraft = !course.status || course.status === 'draft';

              return (
                <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Thumbnail */}
                  <td className="px-6 py-4 whitespace-nowrap w-24">
                    <img 
                      src={course.thumbnail || 'https://picsum.photos/seed/default/100/60'} 
                      className="w-16 h-10 object-cover rounded-xl shadow-xs" 
                      alt=""
                    />
                  </td>

                  {/* Title & Category */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm line-clamp-1">{course.title}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium text-[10px]">
                        {course.category}
                      </span>
                      {course.type === 'compulsory' ? (
                        <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          必修
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px]">
                          選修
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Questions & Pass score */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">
                      題庫：<strong className={qNum >= 10 ? 'text-emerald-600' : 'text-rose-600'}>{qNum} 題</strong>
                      {course.isRandom10 && <span className="text-[10px] text-slate-400 ml-1">(抽10題)</span>}
                    </div>
                    <div className="text-slate-400 text-[10px] mt-0.5">及格門檻：{course.passScore || 70} 分</div>
                  </td>

                  {/* Status & Toggle */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isPub ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        isClosed ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {isPub ? '● 開放中' : isClosed ? '● 已關閉' : '● 草稿中'}
                      </span>

                      {/* Status switch button */}
                      <button
                        onClick={() => handleToggleStatus(course)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isPub ? 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={isPub ? '關閉此課程' : '開放此課程'}
                      >
                        <Power className="h-3.5 w-3.5" />
                        {isPub ? '關閉' : '開放'}
                      </button>
                    </div>

                    {/* View history */}
                    {course.publishHistory && course.publishHistory.length > 0 && (
                      <button
                        onClick={() => setHistoryModalCourse(course)}
                        className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 mt-1"
                      >
                        <History className="h-3 w-3" /> 開放紀錄 ({course.publishHistory.length})
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* 學員成績名冊按鈕 */}
                      <button 
                        onClick={() => setStudentScoreModalCourse(course)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1"
                        title="查看所有學員測驗成績與未通過名單"
                      >
                        <Users className="h-3.5 w-3.5" /> 學員成績
                      </button>

                      {/* 複製課程 */}
                      <button 
                        onClick={() => handleDuplicate(course.id)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                        title="複製為新課程草稿"
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      {/* 編輯 */}
                      <button 
                        onClick={() => startEdit(course)} 
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                        title="編輯課程"
                      >
                        <Edit className="h-4 w-4"/>
                      </button>

                      {/* 刪除 */}
                      <button 
                        onClick={() => handleDelete(course.id)} 
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="刪除課程"
                      >
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 1. 分類管理 Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-fade-in text-slate-800 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-brand-600" /> 課程分類設定
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Form to Add / Edit Category */}
              {editingCat ? (
                <form onSubmit={handleUpdateCategory} className="flex gap-2">
                  <input 
                    type="text" 
                    value={editingCat.name} 
                    onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-brand-500"
                    placeholder="修改分類名稱..."
                  />
                  <button type="submit" className="bg-brand-600 text-white text-xs font-bold px-3 py-2 rounded-xl">儲存</button>
                  <button type="button" onClick={() => setEditingCat(null)} className="bg-slate-100 text-slate-600 text-xs px-3 py-2 rounded-xl">取消</button>
                </form>
              ) : (
                <form onSubmit={handleCreateCategory} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCatName} 
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-brand-500"
                    placeholder="輸入新分類名稱 (如：環境永續)..."
                  />
                  <button type="submit" className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl">新增</button>
                </form>
              )}

              {/* Category List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setEditingCat({ id: cat.id, name: cat.name })}
                        className="p-1 text-slate-500 hover:text-brand-600"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`確定要刪除分類【${cat.name}】嗎？`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 開放紀錄 Modal */}
      {historyModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-fade-in text-slate-800 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="h-5 w-5 text-brand-600" /> 《{historyModalCourse.title}》開放紀錄
              </h3>
              <button onClick={() => setHistoryModalCourse(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-72 overflow-y-auto">
              {historyModalCourse.publishHistory && historyModalCourse.publishHistory.length > 0 ? (
                historyModalCourse.publishHistory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                        item.action === 'opened' ? 'bg-emerald-100 text-emerald-800' : 
                        item.action === 'closed' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.action === 'opened' ? '開放課程' : item.action === 'closed' ? '關閉課程' : '草稿存檔'}
                      </span>
                      <span className="text-slate-500 ml-2 font-mono">{item.timestamp}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">操作：{item.operator}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">尚無紀錄</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. 學員成績名冊 Modal (通過、未及格、未測驗名單) */}
      {studentScoreModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 animate-fade-in text-slate-800 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-brand-600" />
                  《{studentScoreModalCourse.title}》學員測驗成績總覽
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">及格門檻：{studentScoreModalCourse.passScore || 70} 分</p>
              </div>
              <button onClick={() => { setStudentScoreModalCourse(null); setScoreSearchQuery(''); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="pt-4 pb-2">
              <input
                type="text"
                placeholder="搜尋學員姓名、工號或部門..."
                value={scoreSearchQuery}
                onChange={(e) => setScoreSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {allUsers
                .filter(u => u.role === 'employee')
                .filter(u => {
                  if (!scoreSearchQuery) return true;
                  const q = scoreSearchQuery.toLowerCase();
                  return u.name.toLowerCase().includes(q) || (u.employeeId && u.employeeId.toLowerCase().includes(q)) || (u.department && u.department.toLowerCase().includes(q));
                })
                .map(u => {
                  const p = progress.find(item => item.userId === u.id && item.courseId === studentScoreModalCourse.id);
                  const hasScore = p?.quizScore !== null && p?.quizScore !== undefined;
                  const isPassed = !!p?.completed;
                  const score = hasScore ? p!.quizScore : null;

                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-2xl hover:border-brand-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({u.employeeId || u.id})</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{u.department} | {u.title}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        {isPassed ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-emerald-600 font-mono">{score} 分</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">及格通過</span>
                          </div>
                        ) : hasScore ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-rose-600 font-mono">{score} 分</span>
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">未達標準 ({p?.failCount || 1}次未過)</span>
                          </div>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">尚未測驗</span>
                        )}
                        {p?.attemptDate && (
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{p.attemptDate}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseManagement;