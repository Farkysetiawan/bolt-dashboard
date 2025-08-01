import React, { useState, useCallback, useMemo, Suspense, lazy } from 'react';
import DashboardHeader from './DashboardHeader';
import TodoList from './TodoList';
import DailyJournal from './DailyJournal';
import LearningTracker from './LearningTracker';
import QuickAccessLinks from './QuickAccessLinks';
import PromptBank from './PromptBank';
import UserProfile from './UserProfile';
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
  BarChart3,
  Dumbbell
} from 'lucide-react';

// Lazy load heavy components
const ChannelManager = lazy(() => import('./ChannelManager'));
const QuickLinksManager = lazy(() => import('./QuickLinksManager'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const BodyTracker = lazy(() => import('./BodyTracker'));

type CategoryType = 'all' | 'todos' | 'journal' | 'content' | 'learning' | 'links' | 'prompts' | 'body' | 'profile' | 'analytics';

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
    id: 'body',
    name: 'Body',
    icon: <Dumbbell className="w-4 h-4" />
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

// Loading component for lazy loaded components
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const Dashboard: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Memoize handlers to prevent unnecessary re-renders
  const handleCategorySelect = useCallback((categoryId: CategoryType) => {
    setActiveCategory(categoryId);
    setMobileMenuOpen(false);
  }, []);

  const handleUserIconClick = useCallback(() => {
    setActiveCategory(prev => prev === 'profile' ? 'all' : 'profile');
  }, []);

  const handleAnalyticsIconClick = useCallback(() => {
    setActiveCategory(prev => prev === 'analytics' ? 'all' : 'analytics');
  }, []);

  // Memoize page info to prevent recalculation
  const pageInfo = useMemo(() => {
    const category = categories.find(cat => cat.id === activeCategory);
    
    if (activeCategory === 'profile') {
      return {
        title: 'Profile',
        subtitle: 'Manage your account information and preferences'
      };
    }
    
    if (activeCategory === 'analytics') {
      return {
        title: 'Analytics',
        subtitle: 'Track your productivity trends and insights'
      };
    }
    
    return {
      title: category?.name || 'Dashboard',
      subtitle: activeCategory === 'all' 
        ? 'Overview of all your productivity tools'
        : activeCategory === 'body'
        ? 'Track your fitness journey and health goals'
        : `Manage your ${category?.name.toLowerCase()}`
    };
  }, [activeCategory]);

  // Optimized content rendering with lazy loading
  const renderContent = useCallback(() => {
    switch (activeCategory) {
      case 'analytics':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <AnalyticsDashboard />
          </Suspense>
        );
      case 'todos':
        return <TodoList readOnly={false} />;
      case 'journal':
        return <DailyJournal readOnly={false} />;
      case 'content':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ChannelManager />
          </Suspense>
        );
      case 'learning':
        return <LearningTracker readOnly={false} />;
      case 'body':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <BodyTracker />
          </Suspense>
        );
      case 'links':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <QuickLinksManager />
          </Suspense>
        );
      case 'prompts':
        return <PromptBank readOnly={false} />;
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
              <div className="stagger-item"><TodoList readOnly={true} /></div>
              <div className="stagger-item"><DailyJournal readOnly={true} /></div>
              <div className="stagger-item"><LearningTracker readOnly={true} /></div>
              <div className="stagger-item"><PromptBank readOnly={true} /></div>
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="stagger-item"><TodoList readOnly={true} /></div>
                <div className="stagger-item"><LearningTracker readOnly={true} /></div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="stagger-item"><DailyJournal readOnly={true} /></div>
                <div className="stagger-item"><PromptBank readOnly={true} /></div>
              </div>
            </div>
          </div>
        );
    }
  }, [activeCategory]);

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
          <div className="sticky top-12 z-30 bg-white border-b border-gray-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-semibold text-gray-900">
                {pageInfo.title}
              </h1>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn-icon-secondary"
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
              <div className="fixed top-20 left-2 right-2 bg-white rounded-xl shadow-lg z-50 border border-gray-200 sidebar">
                <div className="p-1 sidebar-nav">
                  {categories.map((category, index) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`sidebar-nav-item w-full stagger-item ${
                        activeCategory === category.id ? 'active' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {category.icon}
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
          <div className="fixed top-12 left-0 w-52 h-screen bg-white border-r border-gray-200 overflow-y-auto sidebar">
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
                    {category.icon}
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
            <div className="page-header hidden lg:block">
              <h1 className="page-title">
                {pageInfo.title}
              </h1>
              <p className="page-subtitle">
                {pageInfo.subtitle}
              </p>
            </div>
            
            {/* Render content */}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;