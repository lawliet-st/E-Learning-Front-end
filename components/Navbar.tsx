import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { BookOpen, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import Avatar from './Avatar';

const Navbar: React.FC = () => {
  const { user, logout } = useStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-brand-600';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-brand-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">盛餘HRD領航者</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user.role === 'admin' ? (
              // Admin Menu
              <>
                <Link to="/admin" className={isActive('/admin')}>戰情室</Link>
                <Link to="/admin/create-course" className={isActive('/admin/create-course')}>課程管理</Link>
                <Link to="/admin/users" className={isActive('/admin/users')}>使用者管理</Link>
                <Link to="/admin/records" className={isActive('/admin/records')}>學習記錄查詢</Link>
              </>
            ) : (
              // Employee Menu
              <>
                <Link to="/" className={isActive('/')}>課程中心</Link>
                <Link to="/my-learning" className={isActive('/my-learning')}>我的學習</Link>
                <Link to="/profile" className={isActive('/profile')}>我的檔案</Link>
              </>
            )}
            
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-2">
                <Avatar src={user.avatar} name={user.name} className="h-8 w-8 rounded-full border border-gray-200" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.title}</span>
                </div>
                {user.role === 'admin' && (
                  <span title="管理員">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                  </span>
                )}
              </div>
              <button 
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="登出"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-900">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             {user.role === 'admin' ? (
              <>
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">戰情室</Link>
                <Link to="/admin/create-course" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">課程管理</Link>
                <Link to="/admin/users" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">使用者管理</Link>
                <Link to="/admin/records" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">學習記錄查詢</Link>
              </>
            ) : (
              <>
                <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">課程中心</Link>
                <Link to="/my-learning" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">我的學習</Link>
                <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">我的檔案</Link>
              </>
            )}
            <button onClick={logout} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">登出</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;