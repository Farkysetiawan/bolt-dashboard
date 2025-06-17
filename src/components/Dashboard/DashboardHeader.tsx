import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, LayoutDashboard, BarChart3, Search } from 'lucide-react';

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <LayoutDashboard className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">FlexBoard</h1>
          </div>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1">
            {/* Analytics */}
            <button
              onClick={onAnalyticsClick}
              className={`p-2 rounded-md transition-colors duration-150 ${
                isAnalyticsActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            
            {/* Profile */}
            <button
              onClick={onUserClick}
              className={`p-2 rounded-md transition-colors duration-150 ${
                isProfileActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isProfileActive ? 'Back to Dashboard' : 'Profile'}
            >
              {isProfileActive ? (
                <LayoutDashboard className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
            
            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader