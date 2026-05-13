import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store';
import { useParams, Link } from 'react-router-dom';
import { User, TalentProfileData } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { User as UserIcon, Calendar, TrendingUp, Grid, Sparkles, MapPin, HelpCircle, Tag } from 'lucide-react';
import { generateCareerAdvice } from '../services/gemini';

const NineBoxGrid: React.FC<{ metrics: any }> = ({ metrics }) => {
  const getCellClass = (p: string, pt: string) => {
    // Determine position from passed metrics
    const isTarget = metrics.profile.nineBoxPosition.performance === p && metrics.profile.nineBoxPosition.potential === pt;
    
    let baseColor = 'bg-gray-50 border-gray-200';
    if (p === 'High' && pt === 'High') baseColor = 'bg-purple-100 border-purple-200'; 
    else if (p === 'Low' && pt === 'Low') baseColor = 'bg-red-50 border-red-200'; 
    
    return `relative p-2 border ${baseColor} flex items-center justify-center h-20 text-xs text-center ${isTarget ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-lg z-10' : ''}`;
  };

  return (
    <div className="w-full max-w-xs mx-auto relative pl-6 pb-6">
       <div className="absolute left-0 top-0 bottom-6 flex items-center justify-center w-6">
          <span className="transform -rotate-90 text-xs font-bold text-gray-500 whitespace-nowrap">潛力 (Potential) &rarr;</span>
       </div>

       <div className="grid grid-cols-3 gap-1">
          <div className={getCellClass('Low', 'High')}>謎樣人才</div>
          <div className={getCellClass('Medium', 'High')}>明日之星</div>
          <div className={getCellClass('High', 'High')}>超級明星 (Star)</div>
          
          <div className={getCellClass('Low', 'Medium')}>表現不穩</div>
          <div className={getCellClass('Medium', 'Medium')}>核心骨幹</div>
          <div className={getCellClass('High', 'Medium')}>績效明星</div>

          <div className={getCellClass('Low', 'Low')}>風險名單</div>
          <div className={getCellClass('Medium', 'Low')}>安分守己</div>
          <div className={getCellClass('High', 'Low')}>專業老手</div>
       </div>

       <div className="absolute bottom-0 left-6 right-0 h-6 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-500">績效 (Performance) &rarr;</span>
       </div>
       
       <div className="mt-4 text-xs text-gray-500 space-y-1">
           <p>潛力得分: <span className="font-bold">{Math.round(metrics.calculatedPot)}</span> (技能+年齡)</p>
           <p>績效平均: <span className="font-bold">{metrics.calculatedPerf.toFixed(1)}</span> (近3年)</p>
       </div>
    </div>
  );
};

const TalentProfile: React.FC = () => {
  const { user: currentUser, getUserById, getAllUserMetrics } = useStore();
  const { userId } = useParams<{ userId: string }>();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const allMetrics = getAllUserMetrics();

  useEffect(() => {
    if (userId) {
      const u = getUserById(userId);
      setTargetUser(u || null);
    } else {
      setTargetUser(currentUser);
    }
  }, [userId, currentUser, getUserById]);

  useEffect(() => {
    if (targetUser) {
      setLoadingAi(true);
      generateCareerAdvice(targetUser).then(advice => {
        setAiAdvice(advice);
        setLoadingAi(false);
      });
    }
  }, [targetUser]);

  if (!targetUser) return <div className="p-8">找不到該員工資料</div>;
  if (targetUser.role === 'admin' && !userId) return <div className="p-8">管理員請從戰情室查看員工檔案。</div>;

  const profile = targetUser.profile;
  const metrics = allMetrics.find(m => m.userId === targetUser.id) || { 
      calculatedPot: 0, 
      calculatedPerf: 0, 
      profile: profile 
  }; // Fallback
  
  const radarData = profile.skills;
  const performanceData = profile.performanceHistory;
  
  // Hogan Radar Data - Merging for a "Colorful Radar"
  // Normalizing categories to fit on one radar
  const hoganRadarData = [
      ...(profile.assessment.hpiDetails || []).map(d => ({ subject: d.label, A: d.score, type: 'HPI', fill: '#3b82f6' })),
      ...(profile.assessment.hdsDetails || []).map(d => ({ subject: d.label, B: d.score, type: 'HDS', fill: '#ef4444' })),
      ...(profile.assessment.mvpiDetails || []).map(d => ({ subject: d.label, C: d.score, type: 'MVPI', fill: '#10b981' })),
  ];
  // Recharts radar needs unique keys per axis. To show 3 separate blobs, we usually need 3 data keys on the same axis set, 
  // but here axes are different. 
  // Workaround: We will show 3 separate Radar Charts side-by-side or stacked, OR format data so one RadarChart has all axes.
  // Given "Coloroful Radar", let's try one big chart with all axes.
  
  const combinedHoganData = [
      ...(profile.assessment.hpiDetails || []).map(d => ({ subject: d.label, score: d.score, category: '性格 (HPI)', color: '#3b82f6' })),
      ...(profile.assessment.hdsDetails || []).map(d => ({ subject: d.label, score: d.score, category: '阻礙 (HDS)', color: '#ef4444' })),
      ...(profile.assessment.mvpiDetails || []).map(d => ({ subject: d.label, score: d.score, category: '動機 (MVPI)', color: '#10b981' })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row gap-8 items-start">
        <img src={targetUser.avatar} alt={targetUser.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                {targetUser.name}
                {metrics.isHighPotential && (
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full border border-purple-200">High Potential</span>
                )}
              </h1>
              <p className="text-lg text-slate-600 mt-1">{targetUser.title} | {targetUser.department}</p>
              {profile.tags && profile.tags.length > 0 && (
                  <div className="flex gap-2 mt-3">
                      {profile.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                              <Tag className="h-3 w-3" /> {tag}
                          </span>
                      ))}
                  </div>
              )}
            </div>
            {userId && <Link to="/admin" className="text-sm text-gray-500 hover:text-brand-600">返回戰情室</Link>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">入職日期</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-brand-500" />
                <span className="font-semibold">{profile.joinDate}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">年齡</p>
              <div className="flex items-center gap-2 mt-1">
                <UserIcon className="h-4 w-4 text-brand-500" />
                <span className="font-semibold">{profile.age} 歲</span>
              </div>
            </div>
             <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Hogan 測評狀態</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`font-semibold ${profile.assessment.completed ? 'text-green-600' : 'text-gray-400'}`}>
                  {profile.assessment.completed ? '已完成' : '未完成'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">專業技能測驗</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`font-semibold ${profile.skillAssessmentScore ? 'text-green-600' : 'text-red-500'}`}>
                  {profile.skillAssessmentScore ? `${profile.skillAssessmentScore} 分` : '未測驗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Metrics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Skills Radar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              專業技能雷達
            </h3>
            {profile.skillAssessmentScore ? (
                <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false}/>
                    <Radar name={targetUser.name} dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
                    <Tooltip />
                    </RadarChart>
                </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-80 w-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-red-500 font-bold flex items-center gap-2">
                        <HelpCircle className="h-6 w-6" /> 請先進行專業技能測驗以顯示圖表
                    </p>
                </div>
            )}
            
            <div className="absolute bottom-4 right-4 text-xs text-gray-400 flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">
                <HelpCircle className="h-3 w-3" />
                若有疑問請洽人力資源處
            </div>
          </div>

          {/* Performance History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              歷年績效考核
            </h3>
             <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 5]} ticks={[1,2,3,4,5]} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="rating" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

           {/* Hogan Detailed Results - Colorful Radar */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Hogan 性格測評詳細報告</h3>
            {profile.assessment.completed ? (
              <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={combinedHoganData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} />
                      <Tooltip />
                      {/* We mock separation by filtering data key, but here we flattened it. 
                          For a true multi-color radar in Recharts with different axes, 
                          we iterate over categories and create multiple Radars if they shared axes, 
                          but they have DIFFERENT axes. 
                          Best approach: One big radar, use `dataKey="score"` and define custom dot colors? 
                          Or just show one unified shape with a gradient? 
                          Let's stick to simple unified shape but with a colorful stroke/fill */}
                      <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="url(#colorHogan)" fillOpacity={0.6} />
                      <defs>
                        <linearGradient id="colorHogan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> HPI 性格</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> HDS 阻礙</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> MVPI 動機</span>
                  </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">該員工尚未完成測評。</p>
            )}
          </div>
        </div>

        {/* Right Column: Analysis & AI */}
        <div className="space-y-8">
          
          {/* 9-Box Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Grid className="h-5 w-5 text-orange-500" />
              人才九宮格
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl">
               <NineBoxGrid metrics={metrics} />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>目前定位：<span className="font-bold text-slate-900">
                  {metrics.profile.nineBoxPosition.performance === 'High' && metrics.profile.nineBoxPosition.potential === 'High' ? '超級明星 (Star)' : 
                   metrics.profile.nineBoxPosition.performance === 'Medium' && metrics.profile.nineBoxPosition.potential === 'Medium' ? '核心骨幹' :
                   metrics.profile.nineBoxPosition.performance} 
              </span></p>
            </div>
          </div>

          {/* AI Career Advice */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Sparkles className="h-24 w-24 text-indigo-600" />
             </div>
             <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Ai 職涯發展建議
            </h3>
            {loadingAi ? (
              <div className="flex items-center gap-2 text-indigo-600 text-sm animate-pulse">
                <span>正在分析數據...</span>
              </div>
            ) : (
              <div className="prose prose-sm text-indigo-800">
                <p>{aiAdvice}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentProfile;