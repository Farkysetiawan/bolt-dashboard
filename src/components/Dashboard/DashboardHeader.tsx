import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDarkMode } from '../../hooks/useDarkMode';
import { LogOut, User, LayoutDashboard, BarChart3, Moon, Sun, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  onUserClick?: () => void;
  onAnalyticsClick?: () => void;
  isProfileActive?: boolean;
  isAnalyticsActive?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onUserClick, 
  onAnalyticsClick,
  isProfileActive = false,
  isAnalyticsActive = false 
}) => {
  const { signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 shadow-xl border-b-2 border-blue-200 dark:border-purple-700 backdrop-blur-md">
      <div className="w-full px-4 lg:px-6">
        <div className="flex justify-between items-center py-3 lg:py-4">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Enhanced Logo */}
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300">
              <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white animate-pulse" />
            </div>
            <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
              FlexBoard
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`group relative overflow-hidden p-2 lg:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-200' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                {isDarkMode ? (
                  <Sun className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-12 transition-transform duration-300" />
                )}
              </div>
            </button>

            {/* Analytics Icon */}
            <button
              onClick={onAnalyticsClick}
              className={`group relative overflow-hidden p-2 lg:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                isAnalyticsActive 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-800 dark:to-purple-800 text-blue-700 dark:text-blue-300 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-700 dark:hover:to-purple-700'
              }`}
              title="Analytics"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <BarChart3 className={`w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-300 ${isAnalyticsActive ? 'animate-pulse' : 'group-hover:rotate-12'}`} />
              </div>
            </button>
            
            {/* User Icon */}
            <button
              onClick={onUserClick}
              className={`group relative overflow-hidden p-2 lg:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                isProfileActive 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-800 dark:to-purple-800 text-blue-700 dark:text-blue-300 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-700 dark:hover:to-purple-700'
              }`}
              title={isProfileActive ? 'Back to Dashboard' : 'Profile'}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                {isProfileActive ? (
                  <LayoutDashboard className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <User className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-12 transition-transform duration-300" />
                )}
              </div>
            </button>
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="group relative overflow-hidden flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-1 lg:space-x-2">
                <LogOut className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:block font-medium">Sign out</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;