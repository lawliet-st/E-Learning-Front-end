import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      await login(employeeId, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查帳號密碼。');
      setIsLoading(false);
    }
  };

  const fillCredential = (empId: string, psw: string) => {
    setEmployeeId(empId);
    setPassword(psw);
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-brand-600 p-3 rounded-xl shadow-lg">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          盛餘HRD領航者
        </h2>
        <p className="text-center text-xs text-slate-400 font-medium tracking-wide mt-1">
          SYSCO HRD ナビゲーター · e-ラーニング研修プラットフォーム
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">
          登入方式與 SHR 人資系統相同 <span className="text-[11px] text-slate-400 block mt-0.5">(SHR人事システムと同じアカウントでログイン)</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                     <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                員工編號 <span className="text-xs text-slate-400 font-normal">/ 社員番号 (ID)</span>
              </label>
              <div className="mt-1">
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="例如：25016 / 05432"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼 <span className="text-xs text-slate-400 font-normal">/ パスワード (預設身分證字號)</span>
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="請輸入密碼"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    <span>登入中，請稍候... / ログイン中...</span>
                  </span>
                ) : (
                  <span>登入 / ログイン</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-400 text-xs">快速登入 (測試用) / クイックログイン</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillCredential('25016', 'A123456789')}
                className="w-full inline-flex flex-col justify-center items-center py-2 px-3 border border-amber-300 rounded-md shadow-sm bg-amber-50 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                <span>👑 25016 (主控者)</span>
                <span className="text-[10px] text-amber-600 font-normal">スーパー管理者</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredential('98014', 'A123456789')}
                className="w-full inline-flex flex-col justify-center items-center py-2 px-3 border border-amber-300 rounded-md shadow-sm bg-amber-50 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                <span>👑 98014 (主管主控)</span>
                <span className="text-[10px] text-amber-600 font-normal">スーパー管理者</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;