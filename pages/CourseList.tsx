import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { PlayCircle, Clock, CheckCircle, Info, X, Search, Filter, Megaphone, Plus, Edit2, Trash2, Pin, ChevronRight, Bell, Sparkles } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Course, Announcement } from '../types';

const CourseCard: React.FC<{ course: Course; isCompleted: boolean; isCompulsory: boolean; onShowVisual: (c: Course) => void }> = ({ course, isCompleted, isCompulsory, onShowVisual }) => {
    const [imgError, setImgError] = useState(false);
    
    // Data for radar chart
    const radarData = [
        { subject: '邏輯', A: course.attributes?.logic || 50 },
        { subject: '專業', A: course.attributes?.professional || 50 },
        { subject: '難度', A: course.attributes?.difficulty || 50 },
        { subject: '重要', A: course.attributes?.importance || 50 },
        { subject: '門檻', A: course.attributes?.knowledgeLimit || 50 },
    ];

    return (
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-brand-200 transition-all flex flex-col md:flex-row h-auto md:h-52">
            {/* Left: Image */}
            <Link to={`/course/${course.id}`} className="block relative w-full md:w-1/3 h-48 md:h-full bg-slate-100 flex-shrink-0 overflow-hidden">
                {(!course.thumbnail || imgError) ? (
                    <div className="w-full h-full bg-gradient-to-br from-brand-600 via-indigo-700 to-slate-900 flex flex-col items-center justify-center p-4 text-white">
                        <PlayCircle className="h-12 w-12 mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-center text-sm line-clamp-2">{course.title}</span>
                    </div>
                ) : (
                    <img 
                        src={course.thumbnail} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        onError={() => setImgError(true)}
                    />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-15 transition-all flex items-center justify-center">
                    <PlayCircle className="text-white opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-110 transition-all h-14 w-14 drop-shadow-lg" />
                </div>
                {isCompleted && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle className="h-3.5 w-3.5" /> 已完成
                    </div>
                )}
                <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
                    {course.category}
                </div>
            </Link>

            {/* Middle: Info */}
            <div className="p-5 flex-1 flex flex-col justify-between border-r border-gray-100">
                <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                            <Link to={`/course/${course.id}`}>{course.title}</Link>
                        </h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isCompulsory ? (
                            <span className="bg-red-50 text-red-600 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                              推薦/必修
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                              選修
                            </span>
                          )}
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                        {course.description}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                    <Link 
                      to={`/course/${course.id}`} 
                      className="text-xs font-bold text-white bg-brand-600 px-4 py-2 rounded-xl hover:bg-brand-700 shadow-sm transition-all flex items-center gap-1"
                    >
                      <PlayCircle className="h-3.5 w-3.5" /> 開始學習
                    </Link>
                    {course.visualSummary && (
                        <button 
                            onClick={(e) => { e.preventDefault(); onShowVisual(course); }}
                            className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200 flex items-center gap-1 transition-colors"
                        >
                            <Info className="h-3.5 w-3.5 text-brand-600" /> 課程簡介
                        </button>
                    )}
                    <div className="flex items-center text-xs text-slate-400 ml-auto font-mono">
                        <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        {course.duration}
                    </div>
                </div>
            </div>

            {/* Right: Radar */}
            <div className="w-full md:w-44 p-2 bg-slate-50/70 flex items-center justify-center flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-100">
                <div className="h-36 w-36 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                            <Radar name="Attributes" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-0 right-0 text-[9px] font-bold text-slate-400 bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">五維指標</div>
                </div>
            </div>
        </div>
    );
};

const CourseList: React.FC = () => {
  const { courses, getCourseProgress, user, announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, categories } = useStore();
  const [visualModalCourse, setVisualModalCourse] = useState<Course | null>(null);

  // Filters State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'compulsory' | 'elective'>('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Announcements State & Pagination (10 per page)
  const [annPage, setAnnPage] = useState(1);
  const annPageSize = 10;
  const totalAnnPages = Math.ceil(announcements.length / annPageSize) || 1;
  const paginatedAnnouncements = announcements.slice((annPage - 1) * annPageSize, annPage * annPageSize);

  // Announcements Management Modal State
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Partial<Announcement> | null>(null);
  const [selectedAnnouncementDetail, setSelectedAnnouncementDetail] = useState<Announcement | null>(null);
  const [annImageUploading, setAnnImageUploading] = useState(false);

  const isCourseCompulsory = (course: Course): boolean => {
    if (course.type === 'compulsory') return true;
    if (user && course.compulsoryTargets) {
      const depts = course.compulsoryTargets.departments || [];
      const uids = course.compulsoryTargets.userIds || [];
      if (depts.includes(user.department)) return true;
      if (uids.includes(user.id)) return true;
    }
    return false;
  };

  // Filter Logic
  const filteredCourses = useMemo(() => {
    return courses
      .filter(c => {
        // Non-admin only sees published courses
        if (user?.role !== 'admin' && c.status && c.status !== 'published') {
          return false;
        }
        return true;
      })
      .filter(course => {
        // Keyword
        if (searchKeyword.trim()) {
          const q = searchKeyword.toLowerCase();
          const matches = course.title.toLowerCase().includes(q) || course.description.toLowerCase().includes(q) || (course.category && course.category.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Category
        if (selectedCategory !== 'all' && course.category !== selectedCategory) {
          return false;
        }

        // Type
        const isComp = isCourseCompulsory(course);
        if (selectedType === 'compulsory' && !isComp) return false;
        if (selectedType === 'elective' && isComp) return false;

        // Duration
        const secs = course.durationSeconds || 3600;
        if (selectedDuration === 'short' && secs > 1800) return false; // <30 mins
        if (selectedDuration === 'medium' && (secs <= 1800 || secs > 3600)) return false; // 30-60 mins
        if (selectedDuration === 'long' && (secs <= 3600 || secs > 7200)) return false; // 1-2 hrs
        if (selectedDuration === 'xlarge' && secs <= 7200) return false; // >2 hrs

        // Status
        const p = getCourseProgress(course.id);
        if (selectedStatus === 'completed' && !p?.completed) return false;
        if (selectedStatus === 'in_progress' && (!p || p.completed)) return false;
        if (selectedStatus === 'not_started' && p) return false;

        return true;
      });
  }, [courses, user, searchKeyword, selectedCategory, selectedType, selectedDuration, selectedStatus, getCourseProgress]);

  // Handle Announcement Image Upload
  const handleAnnImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnnImageUploading(true);

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
          setEditingAnn(prev => ({ ...(prev || {}), imageUrl: data.url }));
        } else {
          alert('圖片上傳失敗');
        }
      } catch (err) {
        console.error(err);
        alert('圖片上傳失敗');
      } finally {
        setAnnImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Announcement Submit
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn?.title || !editingAnn?.content) return;
    if (editingAnn.id) {
      await updateAnnouncement(editingAnn.id, editingAnn);
    } else {
      await addAnnouncement(editingAnn);
    }
    setEditingAnn(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. 盛餘領航者公告欄 (Navigator Announcements) */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-indigo-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/20 text-brand-400 rounded-2xl border border-brand-500/30 flex items-center justify-center">
              <Megaphone className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wide">盛餘HRD領航者公告</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-300 border border-brand-400/40">
                  LMS Navigator
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">即時掌握盛餘內部最新開課、必修訓練與各項重大通知 (共 {announcements.length} 則)</p>
            </div>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAnnModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md self-start md:self-auto"
            >
              <Edit2 className="h-3.5 w-3.5" /> 公告管控
            </button>
          )}
        </div>

        {/* Announcement Grid (10 per page) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3.5">
          {paginatedAnnouncements.map((ann) => (
            <div 
              key={ann.id} 
              onClick={() => setSelectedAnnouncementDetail(ann)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ann.isPinned ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'}`}>
                    {ann.isPinned ? '📌 置頂' : ann.type === 'course_auto' ? '📢 新課發布' : '系統公告'}
                  </span>
                  <span className="text-[10px] text-indigo-300/60 font-mono">{ann.createdAt}</span>
                </div>

                <div className="flex gap-3.5 items-start">
                  {ann.imageUrl && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/15 shrink-0 bg-slate-800 flex items-center justify-center">
                      <img 
                        src={ann.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-indigo-200/70 line-clamp-2 mt-1 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-300/80 font-medium pt-2 border-t border-white/5">
                <span>發布：{ann.author}</span>
                <span className="flex items-center text-brand-400 group-hover:translate-x-0.5 transition-transform font-bold">
                  點擊查看詳情與插圖 <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="col-span-2 text-center py-8 text-indigo-300/60 text-sm">目前尚無公告訊息。</div>
          )}
        </div>

        {/* Pagination Bar for Announcements (10 per page) */}
        {totalAnnPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-indigo-800/40 text-xs">
            <span className="text-indigo-200/60">
              第 {annPage} 頁，共 {totalAnnPages} 頁 (每頁 10 則)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={annPage === 1}
                onClick={() => setAnnPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10 text-white font-semibold transition-all"
              >
                上一頁
              </button>
              
              {Array.from({ length: totalAnnPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setAnnPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      annPage === pageNum 
                        ? 'bg-brand-500 text-white shadow-sm' 
                        : 'bg-white/10 hover:bg-white/20 text-indigo-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={annPage === totalAnnPages}
                onClick={() => setAnnPage(prev => Math.min(totalAnnPages, prev + 1))}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10 text-white font-semibold transition-all"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Announcement Detail Modal (Enhanced with Large High-Res Image Display) */}
      {selectedAnnouncementDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl sm:max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 animate-fade-in text-slate-800 relative border border-slate-200">
            <button 
              onClick={() => setSelectedAnnouncementDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedAnnouncementDetail.isPinned ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
                {selectedAnnouncementDetail.isPinned ? '📌 置頂公告' : selectedAnnouncementDetail.type === 'course_auto' ? '📢 開課通知' : '系統公告'}
              </span>
              <span className="text-xs text-slate-400 font-mono">{selectedAnnouncementDetail.createdAt}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 leading-snug">
              {selectedAnnouncementDetail.title}
            </h3>

            {/* Large Prominent Announcement Image Display */}
            {selectedAnnouncementDetail.imageUrl && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900/5 group relative">
                <img 
                  src={selectedAnnouncementDetail.imageUrl} 
                  alt={selectedAnnouncementDetail.title} 
                  className="w-full max-h-96 object-contain bg-slate-950/5 mx-auto"
                />
                <a 
                  href={selectedAnnouncementDetail.imageUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 shadow-md"
                >
                  🔍 點擊開啟原始大圖
                </a>
              </div>
            )}

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed mb-6 whitespace-pre-line font-medium">
              {selectedAnnouncementDetail.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                發布單位：<strong className="text-slate-800">{selectedAnnouncementDetail.author}</strong>
              </span>
              <div className="flex items-center gap-2">
                {selectedAnnouncementDetail.courseId && (
                  <Link 
                    to={`/course/${selectedAnnouncementDetail.courseId}`} 
                    onClick={() => setSelectedAnnouncementDetail(null)}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1"
                  >
                    <PlayCircle className="h-4 w-4" /> 立即前往修習本課程
                  </Link>
                )}
                <button 
                  onClick={() => setSelectedAnnouncementDetail(null)}
                  className="bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Announcement Management Modal */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 animate-fade-in text-slate-800 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-brand-600" />
                <h3 className="text-lg font-bold text-slate-900">盛餘HRD領航者公告管理</h3>
              </div>
              <button onClick={() => { setShowAnnModal(false); setEditingAnn(null); }} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Form to Add/Edit */}
              <form onSubmit={handleSaveAnnouncement} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-brand-600" /> {editingAnn?.id ? '編輯公告內容' : '發布自訂新公告'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">公告標題 *</label>
                    <input 
                      type="text" 
                      placeholder="請輸入公告標題 (如：📢 115年度全體同仁必修課程已上架)"
                      required
                      value={editingAnn?.title || ''}
                      onChange={(e) => setEditingAnn({ ...editingAnn, title: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">置頂狀態</label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-gray-300">
                      <input 
                        type="checkbox" 
                        checked={!!editingAnn?.isPinned} 
                        onChange={(e) => setEditingAnn({ ...editingAnn, isPinned: e.target.checked })} 
                        className="rounded text-brand-600"
                      />
                      <span className="font-semibold">置頂於公告列表最前</span>
                    </label>
                  </div>
                </div>

                {/* Announcement Image upload */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">公告插圖 (選填，支援上傳圖片或圖片 URL)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="輸入圖片 URL 或點右側選擇檔案上傳..."
                      value={editingAnn?.imageUrl || ''}
                      onChange={(e) => setEditingAnn({ ...editingAnn, imageUrl: e.target.value })}
                      className="flex-1 text-xs border border-gray-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <label className={`cursor-pointer whitespace-nowrap bg-slate-200 hover:bg-slate-300 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all ${annImageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {annImageUploading ? '上傳中...' : '選擇圖片'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAnnImageUpload} />
                    </label>
                  </div>
                  {editingAnn?.imageUrl && (
                    <div className="mt-2 relative inline-block">
                      <img src={editingAnn.imageUrl} alt="" className="h-16 w-24 object-cover rounded-lg border border-slate-200" />
                      <button 
                        type="button" 
                        onClick={() => setEditingAnn({ ...editingAnn, imageUrl: '' })}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">公告內容詳細文字 *</label>
                  <textarea 
                    rows={3}
                    placeholder="請輸入公告詳細內文..."
                    required
                    value={editingAnn?.content || ''}
                    onChange={(e) => setEditingAnn({ ...editingAnn, content: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {editingAnn && (
                    <button 
                      type="button" 
                      onClick={() => setEditingAnn(null)} 
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      取消
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm"
                  >
                    {editingAnn?.id ? '儲存變更' : '立即發布公告'}
                  </button>
                </div>
              </form>

              {/* Announcement List */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">現有公告列表 ({announcements.length})</h4>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-brand-200 transition-colors">
                      <div className="flex items-center gap-3 flex-1 pr-4">
                        {ann.imageUrl && (
                          <img src={ann.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {ann.isPinned && <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">置頂</span>}
                            <span className="text-xs font-bold text-slate-900 truncate">{ann.title}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{ann.content}</p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">{ann.createdAt} by {ann.author}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => setEditingAnn(ann)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="編輯"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { if(confirm('確定要刪除這則公告嗎？')) deleteAnnouncement(ann.id); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="刪除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Visual Summary Modal */}
      {visualModalCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in relative">
                  <button 
                    onClick={() => setVisualModalCourse(null)}
                    className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-gray-200 z-10"
                  >
                      <X className="h-6 w-6 text-gray-600" />
                  </button>
                  <div className="p-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Info className="h-6 w-6 text-brand-600" /> 
                          {visualModalCourse.title} - 視覺化簡介
                      </h2>
                      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-center">
                          <div dangerouslySetInnerHTML={{ __html: visualModalCourse.visualSummary || '' }} className="w-full max-w-2xl" />
                      </div>
                      <div className="mt-6 text-center">
                          <Link 
                            to={`/course/${visualModalCourse.id}`} 
                            className="inline-block bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-md"
                          >
                              立即前往課程
                          </Link>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 3. 多維度篩選器與搜尋列 */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">線上訓練課程</h1>
            <p className="text-xs text-slate-500 mt-1">透過多維度篩選與搜尋，精準探索提升職場實力的專業內訓內容。</p>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full self-start md:self-auto">
            共找到 <strong className="text-brand-600 font-bold">{filteredCourses.length}</strong> 門符合條件的課程
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜尋課程標題或關鍵字..." 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">所有課程分類</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">全部性質 (必修/選修)</option>
              <option value="compulsory">推薦 / 必修課程</option>
              <option value="elective">選修課程</option>
            </select>
          </div>

          {/* Duration Filter */}
          <div>
            <select 
              value={selectedDuration} 
              onChange={(e) => setSelectedDuration(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">全部課程時長</option>
              <option value="short">30 分鐘以內</option>
              <option value="medium">30 ~ 60 分鐘</option>
              <option value="long">1 ~ 2 小時</option>
              <option value="xlarge">2 小時以上</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">全部學習狀態</option>
              <option value="completed">已完成</option>
              <option value="in_progress">進行中</option>
              <option value="not_started">尚未開始</option>
            </select>
          </div>
        </div>

        {/* Active Filters Tag & Reset */}
        {(searchKeyword || selectedCategory !== 'all' || selectedType !== 'all' || selectedDuration !== 'all' || selectedStatus !== 'all') && (
          <div className="flex items-center gap-2 pt-2 text-xs">
            <span className="text-slate-400">已啟用篩選：</span>
            <button 
              onClick={() => {
                setSearchKeyword('');
                setSelectedCategory('all');
                setSelectedType('all');
                setSelectedDuration('all');
                setSelectedStatus('all');
              }}
              className="text-brand-600 hover:text-brand-800 font-semibold underline"
            >
              清除所有篩選條件
            </button>
          </div>
        )}
      </section>

      {/* 4. 單一「課程一覽」列表 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" />
            課程一覽
          </h2>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {filteredCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                isCompleted={!!getCourseProgress(course.id)?.completed} 
                isCompulsory={isCourseCompulsory(course)}
                onShowVisual={setVisualModalCourse}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">查無符合條件的課程</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">請嘗試放寬篩選條件或清除關鍵字搜尋，重新查看完整的內訓課程一覽。</p>
            <button
              onClick={() => {
                setSearchKeyword('');
                setSelectedCategory('all');
                setSelectedType('all');
                setSelectedDuration('all');
                setSelectedStatus('all');
              }}
              className="inline-block text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl transition-all"
            >
              重設所有條件
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default CourseList;