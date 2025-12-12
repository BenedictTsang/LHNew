import React from 'react';
import { 
  Home, 
  BookMarked, 
  PenTool, 
  CheckSquare, 
  ClipboardList, 
  TrendingUp, 
  Shield, 
  Database, 
  LogOut, 
  LogIn, 
  BookOpen 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: any) => void;
  userRole: string | null;
  onLogin?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, userRole, onLogin }) => {
  const { user, signOut } = useAuth();
  
  // Helper to check if a button is active
  const isActive = (pageName: string) => currentPage === pageName;
  
  // Style helper
  const getButtonClass = (pageName: string) => 
    `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors w-full ${
      isActive(pageName)
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <nav
      className="fixed top-0 left-0 h-full w-64 bg-white border-r-2 border-gray-200 z-50 shadow-lg flex flex-col"
      style={{ fontFamily: 'Times New Roman, serif' }}
    >
      <div className="py-8 px-4 flex-grow overflow-y-auto">
        {/* --- 1. HEADER --- */}
        <div className="mb-6 px-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Memorize
          </h1>
        </div>

        <div className="space-y-1">
          {/* --- 2. EXISTING BUTTONS (Memorization) --- */}
          <p className="px-4 mt-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Memorization
          </p>
          
          <button onClick={() => onPageChange('new')} className={getButtonClass('new')}>
            <Home size={20} />
            <span>New</span>
          </button>

          <button onClick={() => onPageChange('saved')} className={getButtonClass('saved')}>
            <BookMarked size={20} />
            <span>Saved</span>
          </button>

          {/* --- 3. NEW PRACTICE MODES --- */}
          <p className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Practice Modes
          </p>

          <button onClick={() => onPageChange('spelling')} className={getButtonClass('spelling')}>
            <PenTool size={20} />
            <span>Spelling</span>
          </button>

          <button onClick={() => onPageChange('proofreading')} className={getButtonClass('proofreading')}>
            <CheckSquare size={20} />
            <span>Proofreading</span>
          </button>

          {/* --- 4. STUDENT FEATURES (Assignments & Progress) --- */}
          {user && (
            <>
              <p className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                My Learning
              </p>

              <button onClick={() => onPageChange('assignments')} className={getButtonClass('assignments')}>
                <ClipboardList size={20} />
                <span>My Assignments</span>
              </button>

              <button onClick={() => onPageChange('progress')} className={getButtonClass('progress')}>
                <TrendingUp size={20} />
                <span>My Progress</span>
              </button>
            </>
          )}

          {/* --- 5. ADMIN ONLY --- */}
          {userRole === 'admin' && (
            <>
              <div className="my-4 border-t border-gray-200" />
              <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin Controls
              </p>
              
              <button onClick={() => onPageChange('admin')} className={getButtonClass('admin')}>
                <Shield size={20} />
                <span>User Management</span>
              </button>
              
              <button onClick={() => onPageChange('assignmentManagement')} className={getButtonClass('assignmentManagement')}>
                <ClipboardList size={20} />
                <span>Manage Assignments</span>
              </button>

              <button onClick={() => onPageChange('database')} className={getButtonClass('database')}>
                <Database size={20} />
                <span>Content Database</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- FOOTER (Sign Out) --- */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {user ? (
          <div>
            <div className="mb-3 px-2">
              <p className="text-sm font-bold text-gray-800">{user.display_name || user.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <LogIn size={18} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;