import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { User, Skill, PerformanceRecord } from '../types';
import { Trash2, Edit, Plus, Save, X, Search, ShieldCheck, Crown, UserCheck, UserMinus, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import Avatar from '../components/Avatar';

const AdminUserManagement: React.FC = () => {
  const { user: currentUser, allUsers, addUser, updateUser, deleteUser, updateUserRole } = useStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'superadmin' | 'admin' | 'employee'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Empty user template
  const emptyUser: User = {
    id: '',
    employeeId: '',
    name: '',
    email: '',
    internalEmail: '',
    role: 'employee',
    department: '',
    title: '',
    avatar: 'https://picsum.photos/seed/newuser/100/100',
    profile: {
      age: 25,
      joinDate: new Date().toISOString().split('T')[0],
      performanceHistory: [],
      skills: [],
      nineBoxPosition: { performance: 'Medium', potential: 'Medium' },
      assessment: { hpi: 0, hds: 0, mvpi: 0, completed: false },
      tags: [],
      skillAssessmentScore: 0
    }
  };

  const [formData, setFormData] = useState<User>(emptyUser);

  const startEdit = (user: User) => {
    setFormData(JSON.parse(JSON.stringify(user))); // Deep copy
    setIsEditing(user.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({ ...emptyUser, id: `u${Date.now()}` });
    setIsAdding(true);
    setIsEditing(null);
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData(emptyUser);
  };

  const handleSave = () => {
    if (isAdding) {
      addUser(formData);
    } else {
      updateUser(formData);
    }
    handleCancel();
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此使用者嗎？')) {
      deleteUser(id);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'age' || name === 'joinDate') {
        setFormData(prev => ({ ...prev, profile: { ...prev.profile, [name]: value } }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- Role Promotion / Demotion (Super Admin Privilege) ---
  const isCurrentUserSuperAdmin = currentUser?.role === 'superadmin';

  const handlePromoteToAdmin = async (targetUser: User) => {
    if (!isCurrentUserSuperAdmin) {
      alert('僅系統主控者 (Super Admin) 具備指派管理者的特權');
      return;
    }
    const confirmed = confirm(`確定要將同仁「${targetUser.name} (${targetUser.employeeId || targetUser.id})」變更為【管理者 (Admin)】嗎？\n變更後該同仁將具備課程管理、戰情室及全平台數據檢視權限。`);
    if (confirmed) {
      const ok = await updateUserRole(targetUser.id, 'admin');
      if (ok) {
        alert(`已成功將「${targetUser.name}」設為管理者！`);
      }
    }
  };

  const handleDemoteToEmployee = async (targetUser: User) => {
    if (!isCurrentUserSuperAdmin) {
      alert('僅系統主控者 (Super Admin) 具備收回管理者權限的特權');
      return;
    }
    if (targetUser.id === currentUser?.id) {
      alert('您是系統主控者，無法將自己降級為一般員工！');
      return;
    }
    const confirmed = confirm(`確定要取消「${targetUser.name} (${targetUser.employeeId || targetUser.id})」的管理者權限，回復為【一般員工】嗎？\n變更後其管理選單將被移除，僅能進行一般學習。`);
    if (confirmed) {
      const ok = await updateUserRole(targetUser.id, 'employee');
      if (ok) {
        alert(`已成功將「${targetUser.name}」回復為一般員工！`);
      }
    }
  };

  // --- Nested List Handlers ---
  const addPerformance = () => {
      setFormData(prev => ({
          ...prev,
          profile: {
              ...prev.profile,
              performanceHistory: [...prev.profile.performanceHistory, { year: new Date().getFullYear().toString(), rating: 3 }]
          }
      }));
  };
  
  const updatePerformance = (idx: number, field: keyof PerformanceRecord, val: string | number) => {
      const newHist = [...formData.profile.performanceHistory];
      newHist[idx] = { ...newHist[idx], [field]: val };
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, performanceHistory: newHist } }));
  };
  
  const removePerformance = (idx: number) => {
      const newHist = formData.profile.performanceHistory.filter((_, i) => i !== idx);
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, performanceHistory: newHist } }));
  };

  const addSkill = () => {
      setFormData(prev => ({
          ...prev,
          profile: {
              ...prev.profile,
              skills: [...prev.profile.skills, { subject: '新技能', A: 50, fullMark: 100 }]
          }
      }));
  };

  const updateSkill = (idx: number, field: keyof Skill, val: string | number) => {
      const newSkills = [...formData.profile.skills];
      newSkills[idx] = { ...newSkills[idx], [field]: val };
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, skills: newSkills } }));
  };

  const removeSkill = (idx: number) => {
      const newSkills = formData.profile.skills.filter((_, i) => i !== idx);
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, skills: newSkills } }));
  };

  // --- Filter and Search Logic ---
  const counts = useMemo(() => {
    let superCount = 0;
    let adminCount = 0;
    let employeeCount = 0;
    allUsers.forEach(u => {
      if (u.role === 'superadmin') superCount++;
      else if (u.role === 'admin') adminCount++;
      else employeeCount++;
    });
    return { all: allUsers.length, superadmin: superCount, admin: adminCount, employee: employeeCount };
  }, [allUsers]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      // Role Filter
      if (selectedRoleFilter === 'superadmin' && u.role !== 'superadmin') return false;
      if (selectedRoleFilter === 'admin' && u.role !== 'admin') return false;
      if (selectedRoleFilter === 'employee' && (u.role === 'admin' || u.role === 'superadmin')) return false;

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchId = (u.employeeId || u.id || '').toLowerCase().includes(q);
        const matchDept = (u.department || '').toLowerCase().includes(q);
        const matchTitle = (u.title || '').toLowerCase().includes(q);
        return matchName || matchId || matchDept || matchTitle;
      }
      return true;
    });
  }, [allUsers, selectedRoleFilter, searchTerm]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (role: 'all' | 'superadmin' | 'admin' | 'employee') => {
    setSelectedRoleFilter(role);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">使用者管理與權限指派</h1>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">ユーザー管理・権限設定</span>
            {isCurrentUserSuperAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <Crown className="w-3.5 h-3.5 text-amber-600" /> 系統主控者模式 <span className="text-[10px] font-normal opacity-80">(主幹)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> 管理者檢視模式
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            全體同仁總覽、學習檔案檢視，以及系統管理者權限配置管控 <span className="text-slate-400 font-normal text-xs">/ 社員情報一覧・権限付与</span>
          </p>
        </div>

        <button onClick={startAdd} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 shadow-sm transition text-xs font-bold">
          <Plus className="h-4 w-4" /> 新增使用者 <span className="text-[10px] font-normal opacity-80">/ 新規追加</span>
        </button>
      </div>

      {/* Super Admin / Admin Alert Banner */}
      {isCurrentUserSuperAdmin ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm flex items-start gap-3">
          <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <span className="font-bold">主控者特權提示：</span>
            您擁有指派與取消同仁管理權限的最高控制權。在下方同仁列表的「管理者權限」欄位中，點擊<strong>【設為管理者】</strong>即可賦權；點擊<strong>【降為一般同仁】</strong>即可隨時收回。資料庫每日自動同步時，您指派的管理者均會妥善保留，不受影響。
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div>您目前以「管理者 (Admin)」權限登入，具備課程管理、戰情室與數據分析功能。若需增設或調整其他管理者帳號，請由「系統主控者」進行設定。</div>
        </div>
      )}

      {/* Form Dialog */}
      {(isEditing || isAdding) && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-brand-100 mb-8 animate-fade-in">
             <div className="flex justify-between items-center mb-4 pb-2 border-b">
               <h2 className="font-bold text-lg text-slate-800">{isAdding ? '新增員工' : '編輯員工資料'}</h2>
               <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">員工編號 (帳號/登入帳號)</label>
                    <input name="employeeId" disabled={!!isEditing} value={formData.employeeId} onChange={handleChange} className="w-full border p-2 rounded bg-slate-50 disabled:bg-slate-100 text-sm" placeholder="例如: 05432" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">姓名</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">內部信箱</label>
                    <input name="internalEmail" value={formData.internalEmail || ''} onChange={handleChange} className="w-full border p-2 rounded text-sm" placeholder="user@internal.com" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">部門</label>
                    <input name="department" value={formData.department} onChange={handleChange} className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">職稱</label>
                    <input name="title" value={formData.title} onChange={handleChange} className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">系統角色權限</label>
                    {isCurrentUserSuperAdmin ? (
                      <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white">
                          <option value="employee">一般員工 (Employee)</option>
                          <option value="admin">管理者 (Admin)</option>
                          <option value="superadmin">系統主控者 (Super Admin)</option>
                      </select>
                    ) : (
                      <input disabled value={formData.role === 'superadmin' ? '系統主控者' : formData.role === 'admin' ? '管理者' : '一般員工'} className="w-full border p-2 rounded bg-slate-100 text-sm text-slate-500" />
                    )}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">入職日</label>
                    <input type="date" name="joinDate" value={formData.profile.joinDate} onChange={handleChange} className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">年齡</label>
                    <input type="number" name="age" value={formData.profile.age} onChange={handleChange} className="w-full border p-2 rounded text-sm" />
                </div>
             </div>
             
             {/* Performance Editor */}
             <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="text-sm font-bold text-gray-700">歷年績效評等</h3>
                     <button onClick={addPerformance} className="text-xs bg-brand-600 text-white px-2.5 py-1 rounded hover:bg-brand-700">新增年度</button>
                 </div>
                 {formData.profile.performanceHistory.map((rec, idx) => (
                     <div key={idx} className="flex gap-2 mb-2 items-center">
                         <input value={rec.year} onChange={e => updatePerformance(idx, 'year', e.target.value)} className="w-24 border p-1.5 rounded text-sm" placeholder="年份 (如2024)" />
                         <input type="number" step="0.1" value={rec.rating} onChange={e => updatePerformance(idx, 'rating', parseFloat(e.target.value))} className="w-24 border p-1.5 rounded text-sm" placeholder="評分 1-5" />
                         <button onClick={() => removePerformance(idx)} className="text-red-500 hover:text-red-700 p-1"><X className="h-4 w-4"/></button>
                     </div>
                 ))}
                 {formData.profile.performanceHistory.length === 0 && (
                   <p className="text-xs text-gray-400">尚無年度績效紀錄</p>
                 )}
             </div>

             {/* Skills Editor */}
             <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="text-sm font-bold text-gray-700">專業職能雷達維度</h3>
                     <button onClick={addSkill} className="text-xs bg-brand-600 text-white px-2.5 py-1 rounded hover:bg-brand-700">新增維度</button>
                 </div>
                 {formData.profile.skills.map((skill, idx) => (
                     <div key={idx} className="flex gap-2 mb-2 items-center">
                         <input value={skill.subject} onChange={e => updateSkill(idx, 'subject', e.target.value)} className="flex-1 border p-1.5 rounded text-sm" placeholder="能力指標名稱" />
                         <input type="number" value={skill.A} onChange={e => updateSkill(idx, 'A', parseInt(e.target.value))} className="w-24 border p-1.5 rounded text-sm" placeholder="得分" />
                         <button onClick={() => removeSkill(idx)} className="text-red-500 hover:text-red-700 p-1"><X className="h-4 w-4"/></button>
                     </div>
                 ))}
                 {formData.profile.skills.length === 0 && (
                   <p className="text-xs text-gray-400">尚無技能指標設定</p>
                 )}
             </div>

             <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button onClick={handleCancel} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm">取消</button>
                <button onClick={handleSave} className="px-5 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium text-sm shadow-sm flex items-center gap-1.5">
                  <Save className="w-4 h-4"/> 儲存變更
                </button>
             </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => handleRoleFilterChange('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${selectedRoleFilter === 'all' ? 'bg-white text-brand-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            全部 ({counts.all}) <span className="text-[10px] font-normal opacity-70">/ 全員</span>
          </button>
          <button
            onClick={() => handleRoleFilterChange('superadmin')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap flex items-center gap-1 ${selectedRoleFilter === 'superadmin' ? 'bg-white text-amber-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" /> 主控者 ({counts.superadmin}) <span className="text-[10px] font-normal opacity-70">/ 主幹</span>
          </button>
          <button
            onClick={() => handleRoleFilterChange('admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap flex items-center gap-1 ${selectedRoleFilter === 'admin' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> 管理者 ({counts.admin})
          </button>
          <button
            onClick={() => handleRoleFilterChange('employee')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${selectedRoleFilter === 'employee' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            一般同仁 ({counts.employee}) <span className="text-[10px] font-normal opacity-70">/ 一般</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="搜尋姓名、工號或部門... / 検索..."
            className="w-full pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">同仁 (工號/姓名) <span className="text-[10px] text-gray-400 font-normal">/ 社員</span></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">職稱 <span className="text-[10px] text-gray-400 font-normal">/ 役職</span></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部門 <span className="text-[10px] text-gray-400 font-normal">/ 部署</span></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">聯絡信箱 <span className="text-[10px] text-gray-400 font-normal">/ メール</span></th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">目前身分 <span className="text-[10px] text-gray-400 font-normal">/ 権限</span></th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">管理者權限管控 <span className="text-[10px] text-gray-400 font-normal">/ 権限設定</span></th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作 <span className="text-[10px] text-gray-400 font-normal">/ 操作</span></th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {pagedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                        查無符合篩選條件的同仁資料 / 該当するデータがありません
                      </td>
                    </tr>
                  ) : (
                    pagedUsers.map(u => {
                      const isSuper = u.role === 'superadmin';
                      const isAdmin = u.role === 'admin';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center gap-3">
                                 <Avatar src={u.avatar} name={u.name} className="w-8 h-8 rounded-full border" />
                                 <div>
                                   <div className="font-semibold text-slate-900">{u.name}</div>
                                   <div className="text-xs text-slate-400 font-mono">{u.employeeId || u.id}</div>
                                 </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-600">{u.title || '-'}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-600">{u.department || '-'}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-500">
                                <div>{u.email || '-'}</div>
                                {u.internalEmail && <div className="text-xs text-brand-600">{u.internalEmail}</div>}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-center">
                              {isSuper ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Crown className="w-3 h-3 text-amber-600" /> 主控者
                                </span>
                              ) : isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                  <ShieldCheck className="w-3 h-3 text-blue-600" /> 管理者
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-slate-100 text-slate-600">
                                  一般員工
                                </span>
                              )}
                            </td>
                            
                            {/* Management Toggle Column */}
                            <td className="px-6 py-3.5 whitespace-nowrap text-center text-sm">
                              {isSuper ? (
                                <span className="text-xs text-amber-600 font-semibold flex items-center justify-center gap-1">
                                  <Crown className="w-3.5 h-3.5" /> 系統主控 (最高特權)
                                </span>
                              ) : isCurrentUserSuperAdmin ? (
                                isAdmin ? (
                                  <button
                                    onClick={() => handleDemoteToEmployee(u)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                                    title="取消此同仁的管理權限，回復為一般員工"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" /> 降為一般同仁
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePromoteToAdmin(u)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition"
                                    title="賦予此同仁管理者權限 (可存取戰情室、課程管理等)"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" /> 設為管理者
                                  </button>
                                )
                              ) : (
                                <span className="text-xs text-slate-400">
                                  {isAdmin ? '具備管理權限' : '無管理權限'}
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => startEdit(u)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="編輯同仁">
                                  <Edit className="h-4 w-4"/>
                                </button>
                                <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-800" title="刪除同仁">
                                  <Trash2 className="h-4 w-4"/>
                                </button>
                            </td>
                        </tr>
                      );
                    })
                  )}
              </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredUsers.length > pageSize && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              顯示第 <span className="font-semibold text-gray-700">{(currentPage - 1) * pageSize + 1}</span> 至 <span className="font-semibold text-gray-700">{Math.min(currentPage * pageSize, filteredUsers.length)}</span> 筆，共 <span className="font-semibold text-gray-700">{filteredUsers.length}</span> 筆同仁資料
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="上一頁"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 px-2 font-medium">
                頁次 {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="下一頁"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
         盛餘HRD領航者平台 · 人力資源處數位學習維運小組 #815
      </div>
    </div>
  );
};

export default AdminUserManagement;