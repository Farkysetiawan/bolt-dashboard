import React, { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import TodoList from './TodoList';
import DailyJournal from './DailyJournal';
import ContentTracker from './ContentTracker';
import LearningTracker from './LearningTracker';
import QuickAccessLinks from './QuickAccessLinks';
import PromptBank from './PromptBank';
import UserProfile from './UserProfile';
import AnalyticsDashboard from './AnalyticsDashboard';
import { 
  Clock, 
  BookOpen, 
  Play, 
  GraduationCap, 
  Link, 
  Lightbulb,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

type CategoryType = 'all' | 'todos' | 'journal' | 'content' | 'learning' | 'links' | 'prompts' | 'profile' | 'analytics';

interface Category {
  id: CategoryType;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const categories: Category[] = [
  {
    id: 'all',
    name: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4 lg:w-5 lg:h-5" />,
    color: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  },
  {
    id: 'todos',
    name: 'Todos',
    icon: <Clock className="w-4 h-4 lg:w-5 lg:h-5" />,
    color: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: <BookOpen className="w-4 h-4 lg:w-5 lg:h-5" />,
    color: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
  },
  {
    id: 'content',
    name: 'Content',
    icon: <Play className="w-4 h-4 lg:w-5 lg:h-5" />,
    color: 'text-green-600 hover:text-green-700 hover:bg-green-50'
  },
  {
    id: 'learning',
    name: 'Goals',
    icon: <GraduationCap className="w-4 h-4 lg:w-5 lg:h-5" />,
    color: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
  },
  {
    id: 'links',
    name: 'Links',
    icon: <Link className="w-4 h-4 lg:w-5 lg:h-5" />,
    color: 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
  },
  {
    id: 'prompts',
    name: 'Prompts',
    icon: <Lightbulb className="w-4 h-4 lg:w-5 lg:h-5" />,
    color: 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
  }
];

const Dashboard: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeCategory) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'todos':
        return <TodoList />;
      case 'journal':
        return <DailyJournal />;
      case 'content':
        return <ContentTracker />;
      case 'learning':
        return <LearningTracker />;
      case 'links':
        return <QuickAccessLinks />;
      case 'prompts':
        return <PromptBank />;
      case 'profile':
        return <UserProfile />;
      case 'all':
      default:
        return (
          <div className="space-y-4 lg:space-y-6">
            {/* Mobile: Stack all components vertically with proper spacing */}
            <div className="block lg:hidden space-y-4">
              <TodoList />
              <DailyJournal />
              <ContentTracker />
              <LearningTracker />
              <QuickAccessLinks />
              <PromptBank />
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <TodoList />
                <ContentTracker />
                <LearningTracker />
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                <DailyJournal />
                <QuickAccessLinks />
                <PromptBank />
              </div>
            </div>
          </div>
        );
    }
  };

  const handleCategorySelect = (categoryId: CategoryType) => {
    setActiveCategory(categoryId);
    setMobileMenuOpen(false);
  };

  // Handle user icon click - toggle between profile and dashboard
  const handleUserIconClick = () => {
    if (activeCategory === 'profile') {
      setActiveCategory('all'); // Back to dashboard
    } else {
      setActiveCategory('profile'); // Go to profile
    }
  };

  // Handle analytics icon click - toggle between analytics and dashboard
  const handleAnalyticsIconClick = () => {
    if (activeCategory === 'analytics') {
      setActiveCategory('all'); // Back to dashboard
    } else {
      setActiveCategory('analytics'); // Go to analytics
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        onUserClick={handleUserIconClick}
        onAnalyticsClick={handleAnalyticsIconClick}
        isProfileActive={activeCategory === 'profile'}
        isAnalyticsActive={activeCategory === 'analytics'}
      />
      
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header with Menu Button */}
        <div className="sticky top-14 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-gray-900">
              {activeCategory === 'profile' ? 'Profile' : 
               activeCategory === 'analytics' ? 'Analytics' :
               categories.find(cat => cat.id === activeCategory)?.name || 'Dashboard'}
            </h1>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed top-28 left-4 right-4 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors
                      ${activeCategory === category.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : category.color
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{category.icon}</span>
                    <span className="truncate">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed top-16 left-0 h-screen overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors
                    ${activeCategory === category.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : category.color
                    }
                  `}
                >
                  <span className="flex-shrink-0">{category.icon}</span>
                  <span className="truncate">{category.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64">
        <div className="w-full px-4 py-4 lg:px-6 lg:py-6 max-w-full">
          {/* Desktop Page Title */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeCategory === 'profile' ? 'Profile' : 
               activeCategory === 'analytics' ? 'Analytics' :
               categories.find(cat => cat.id === activeCategory)?.name || 'Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              {activeCategory === 'all' 
                ? 'Overview of all your productivity tools'
                : activeCategory === 'profile'
                ? 'Manage your account information and preferences'
                : activeCategory === 'analytics'
                ? 'Track your productivity trends and insights'
                : `Manage your ${categories.find(cat => cat.id === activeCategory)?.name.toLowerCase()}`
              }
            </p>
          </div>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;