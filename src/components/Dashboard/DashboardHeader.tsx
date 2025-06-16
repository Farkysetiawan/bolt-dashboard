import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, LayoutDashboard, BarChart3 } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-4 lg:px-6">
        <div className="flex justify-between items-center py-3 lg:py-4">
          <div className="flex items-center space-x-2 lg:space-x-4 min-w-0">
            <h1 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">FlexBoard</h1>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
            {/* Analytics Icon */}
            <button
              onClick={onAnalyticsClick}
              className={`p-1.5 lg:p-2 rounded-lg transition-colors ${
                isAnalyticsActive 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Analytics"
            >
              <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            
            {/* User Icon - Toggle between Profile and Dashboard */}
            <button
              onClick={onUserClick}
              className={`p-1.5 lg:p-2 rounded-lg transition-colors ${
                isProfileActive 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={isProfileActive ? 'Back to Dashboard' : 'Profile'}
            >
              {isProfileActive ? (
                <LayoutDashboard className="w-4 h-4 lg:w-5 lg:h-5" />
              ) : (
                <User className="w-4 h-4 lg:w-5 lg:h-5" />
              )}
            </button>
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;