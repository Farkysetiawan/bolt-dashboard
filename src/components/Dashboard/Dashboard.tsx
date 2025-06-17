import React, { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import TodoList from './TodoList';
import DailyJournal from './DailyJournal';
import ContentTracker from './ContentTracker';
import LearningTracker from './LearningTracker';
import QuickAccessLinks from './QuickAccessLinks';
import QuickLinksManager from './QuickLinksManager';
import PromptBank from './PromptBank';
import UserProfile from './UserProfile';
import AnalyticsDashboard from './AnalyticsDashboard';
import { 
  CheckSquare, 
  BookOpen, 
  Play, 
  GraduationCap, 
  Link, 
  Lightbulb,
  LayoutDashboard,
  Menu,
  X,
  BarChart3
} from 'lucide-react';

type CategoryType = 'all' | 'todos' | 'journal' | 'content' | 'learning' | 'links' | 'prompts' | 'profile' | 'analytics';

interface Category {
  id: CategoryType;
  name: string;
  icon: React.ReactNode;
}

const categories: Category[] = [
  {
    id: 'all',
    name: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />
  },
  {
    id: 'todos',
    name: 'Tasks',
    icon: <CheckSquare className="w-4 h-4" />
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: <BookOpen className="w-4 h-4" />
  },
  {
    id: 'content',
    name: 'Content',
    icon: <Play className="w-4 h-4" />
  },
  {
    id: 'learning',
    name: 'Goals',
    icon: <GraduationCap className="w-4 h-4" />
  },
  {
    id: 'links',
    name: 'Links',
    icon: <Link className="w-4 h-4" />
  },
  {
    id: 'prompts',
    name: 'Prompts',
    icon: <Lightbulb className="w-4 h-4" />
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
        return <QuickLinksManager />;
      case 'prompts':
        return <PromptBank />;
      case 'profile':
        return <UserProfile />;
      case 'all':
      default:
        return (
          <div className="space-y-5">
            {/* Mobile: Stack all components */}
            <div className="block lg:hidden space-y-5">
              <TodoList />
              <DailyJournal />
              <ContentTracker />
              <LearningTracker />
              <QuickAccessLinks />
              <PromptBank />
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-5">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-5">
                <TodoList />
                <ContentTracker />
                <LearningTracker />
              </div>
              
              {/* Right Column */}
              <div className="space-y-5">
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

  const handleUserIconClick = () => {
    if (activeCategory === 'profile') {
      setActiveCategory('all');
    } else {
      setActiveCategory('profile');
    }
  };

  const handleAnalyticsIconClick = () => {
    if (activeCategory === 'analytics') {
      setActiveCategory('all');
    } else {
      setActiveCategory('analytics');
    }
  };

  return (
    <div className="content-area">
      <DashboardHeader 
        onUserClick={handleUserIconClick}
        onAnalyticsClick={handleAnalyticsIconClick}
        isProfileActive={activeCategory === 'profile'}
        isAnalyticsActive={activeCategory === 'analytics'}
      />
      
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="sticky top-14 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-gray-900">
              {activeCategory === 'profile' ? 'Profile' : 
               activeCategory === 'analytics' ? 'Analytics' :
               categories.find(cat => cat.id === activeCategory)?.name || 'Dashboard'}
            </h1>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed top-24 left-3 right-3 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
              <div className="p-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`sidebar-nav-item w-full ${
                      activeCategory === category.id ? 'active' : ''
                    }`}
                  >
                    <span className="text-gray-400">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="sidebar w-56 fixed top-14 left-0 h-screen overflow-y-auto">
          <div className="p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Navigation
            </h2>
            <nav className="sidebar-nav">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`sidebar-nav-item w-full ${
                    activeCategory === category.id ? 'active' : ''
                  }`}
                >
                  <span className="text-gray-400">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-56">
        <div className="max-w-7xl mx-auto px-4 py-5 lg:px-6 lg:py-6">
          {/* Desktop Page Header */}
          <div className="page-header hidden lg:block">
            <h1 className="page-title">
              {activeCategory === 'profile' ? 'Profile' : 
               activeCategory === 'analytics' ? 'Analytics' :
               categories.find(cat => cat.id === activeCategory)?.name || 'Dashboard'}
            </h1>
            <p className="page-subtitle">
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