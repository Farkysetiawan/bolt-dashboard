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
          <div className="space-y-4">
            {/* Quick Links at the top */}
            <div className="animate-fadeIn">
              <QuickAccessLinks />
            </div>
            
            {/* Mobile: Stack all components */}
            <div className="block lg:hidden space-y-4">
              <div className="stagger-item"><TodoList /></div>
              <div className="stagger-item"><DailyJournal /></div>
              <div className="stagger-item"><ContentTracker /></div>
              <div className="stagger-item"><LearningTracker /></div>
              <div className="stagger-item"><PromptBank /></div>
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="stagger-item"><TodoList /></div>
                <div className="stagger-item"><ContentTracker /></div>
                <div className="stagger-item"><LearningTracker /></div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="stagger-item"><DailyJournal /></div>
                <div className="stagger-item"><PromptBank /></div>
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        onUserClick={handleUserIconClick}
        onAnalyticsClick={handleAnalyticsIconClick}
        isProfileActive={activeCategory === 'profile'}
        isAnalyticsActive={activeCategory === 'analytics'}
      />
      
      {/* Add top padding to account for fixed header */}
      <div className="pt-12">
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          {/* Mobile Header */}
          <div className="sticky top-12 z-30 bg-white border-b border-gray-200 px-3 py-2 animate-slideDown">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-semibold text-gray-900">
                {activeCategory === 'profile' ? 'Profile' : 
                 activeCategory === 'analytics' ? 'Analytics' :
                 categories.find(cat => cat.id === activeCategory)?.name || 'Dashboard'}
              </h1>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn-icon-secondary micro-bounce"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-25 z-40 animate-fadeIn"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="fixed top-20 left-2 right-2 bg-white rounded-xl shadow-lg z-50 border border-gray-200 animate-scaleIn">
                <div className="p-1">
                  {categories.map((category, index) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`sidebar-nav-item w-full stagger-item ${
                        activeCategory === category.id ? 'active' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
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
          <div className="fixed top-12 left-0 w-52 h-screen bg-white border-r border-gray-200 overflow-y-auto animate-slideIn">
            <div className="p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Navigation
              </h2>
              <nav className="sidebar-nav">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`sidebar-nav-item w-full stagger-item ${
                      activeCategory === category.id ? 'active' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
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
        <main className="lg:ml-52">
          <div className="max-w-7xl mx-auto px-3 py-4 lg:px-4 lg:py-5">
            {/* Desktop Page Header */}
            <div className="page-header hidden lg:block animate-fadeIn">
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
    </div>
  );
};

export default Dashboard;