import React, { useState } from 'react';
import { useStore } from '../store';
import { User, Skill, PerformanceRecord } from '../types';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';

const AdminUserManagement: React.FC = () => {
  const { allUsers, addUser, updateUser, deleteUser } = useStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Empty user template
  const emptyUser: User = {
    id: '',
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

  // --- Nested List Handlers ---
  const addPerformance = () => {
      setFormData(prev => ({
          ...prev,
          profile: {
              ...prev.profile,
              performanceHistory: [...prev.profile.performanceHistory, { year: new Date().getFullYear().toString(), rating: 3 }]
          }
      }));
  }
  
  const updatePerformance = (idx: number, field: keyof PerformanceRecord, val: string | number) => {
      const newHist = [...formData.profile.performanceHistory];
      newHist[idx] = { ...newHist[idx], [field]: val };
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, performanceHistory: newHist } }));
  }
  
  const removePerformance = (idx: number) => {
      const newHist = formData.profile.performanceHistory.filter((_, i) => i !== idx);
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, performanceHistory: newHist } }));
  }

  const addSkill = () => {
      setFormData(prev => ({
          ...prev,
          profile: {
              ...prev.profile,
              skills: [...prev.profile.skills, { subject: '新技能', A: 50, fullMark: 100 }]
          }
      }));
  }

  const updateSkill = (idx: number, field: keyof Skill, val: string | number) => {
      const newSkills = [...formData.profile.skills];
      newSkills[idx] = { ...newSkills[idx], [field]: val };
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, skills: newSkills } }));
  }

  const removeSkill = (idx: number) => {
      const newSkills = formData.profile.skills.filter((_, i) => i !== idx);
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, skills: newSkills } }));
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">使用者管理</h1>
        <button onClick={startAdd} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700">
            <Plus className="h-4 w-4" /> 新增使用者
        </button>
      </div>

      {(isEditing || isAdding) && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-brand-100 mb-8 animate-fade-in">
             <h2 className="font-bold text-lg mb-4">{isAdding ? '新增員工' : '編輯員工資料'}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-xs text-gray-500">姓名</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500">Email</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500">內部信箱</label>
                    <input name="internalEmail" value={formData.internalEmail || ''} onChange={handleChange} className="w-full border p-2 rounded" placeholder="user@internal.com" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500">部門</label>
                    <input name="department" value={formData.department} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500">職稱</label>
                    <input name="title" value={formData.title} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500">角色</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-2 rounded">
                        <option value="employee">一般員工</option>
                        <option value="admin">管理員</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500">入職日</label>
                    <input type="date" name="joinDate" value={formData.profile.joinDate} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500">年齡</label>
                    <input type="number" name="age" value={formData.profile.age} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
             </div>
             
             {/* Performance Editor */}
             <div className="mb-6 p-4 bg-gray-50 rounded">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="text-sm font-bold">歷年績效</h3>
                     <button onClick={addPerformance} className="text-xs bg-brand-600 text-white px-2 py-1 rounded">新增</button>
                 </div>
                 {formData.profile.performanceHistory.map((rec, idx) => (
                     <div key={idx} className="flex gap-2 mb-2 items-center">
                         <input value={rec.year} onChange={e => updatePerformance(idx, 'year', e.target.value)} className="w-20 border p-1 rounded text-sm" placeholder="Year" />
                         <input type="number" step="0.1" value={rec.rating} onChange={e => updatePerformance(idx, 'rating', parseFloat(e.target.value))} className="w-20 border p-1 rounded text-sm" placeholder="1-5" />
                         <button onClick={() => removePerformance(idx)} className="text-red-500"><X className="h-4 w-4"/></button>
                     </div>
                 ))}
             </div>

             {/* Skills Editor */}
             <div className="mb-6 p-4 bg-gray-50 rounded">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="text-sm font-bold">專業技能</h3>
                     <button onClick={addSkill} className="text-xs bg-brand-600 text-white px-2 py-1 rounded">新增</button>
                 </div>
                 {formData.profile.skills.map((skill, idx) => (
                     <div key={idx} className="flex gap-2 mb-2 items-center">
                         <input value={skill.subject} onChange={e => updateSkill(idx, 'subject', e.target.value)} className="flex-1 border p-1 rounded text-sm" placeholder="Skill Name" />
                         <input type="number" value={skill.A} onChange={e => updateSkill(idx, 'A', parseInt(e.target.value))} className="w-20 border p-1 rounded text-sm" placeholder="Score" />
                         <button onClick={() => removeSkill(idx)} className="text-red-500"><X className="h-4 w-4"/></button>
                     </div>
                 ))}
             </div>

             <div className="flex justify-end gap-2 mt-4">
                <button onClick={handleCancel} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">取消</button>
                <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">儲存</button>
             </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">職稱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">部門</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email / 內部信箱</th>
                    <th className="px-6 py-3 text-right">操作</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map(u => (
                    <tr key={u.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center gap-2">
                             <img src={u.avatar} className="w-8 h-8 rounded-full" />
                             {u.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <div>{u.email}</div>
                            {u.internalEmail && <div className="text-xs text-brand-600">{u.internalEmail}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => startEdit(u)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit className="h-4 w-4"/></button>
                            <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4"/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
         若有任何問題請洽詢人力資源處#815
      </div>
    </div>
  );
};

export default AdminUserManagement;