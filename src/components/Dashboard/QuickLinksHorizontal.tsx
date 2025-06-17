import React, { useState, useEffect, useRef } from 'react';
import { Link, Plus, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  user_id: string;
  order_index?: number;
}

const QuickLinksHorizontal: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  useEffect(() => {
    checkScrollability();
  }, [links]);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_links')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching quick links:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200; // Scroll by 200px
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    return url && (url.startsWith('http') || url.startsWith('data:image/'));
  };

  if (loading) {
    return (
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg animate-pulse flex-shrink-0"></div>
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
          <Link className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No quick links yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Left scroll indicator */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all duration-150"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Right scroll indicator */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all duration-150"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide"
        onScroll={checkScrollability}
        style={{ 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
      >
        {links.map((link) => {
          const hasCustomLogo = isValidImageUrl(link.icon || '');
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center flex-shrink-0"
              title={link.title || getDomainFromUrl(link.url)}
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-gray-300 hover:shadow-sm transition-all duration-150 mb-2">
                {hasCustomLogo ? (
                  <img
                    src={link.icon}
                    alt={link.title || 'Logo'}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      // Fallback to default icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <ExternalLink className={`w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-150 ${hasCustomLogo ? 'hidden' : ''}`} />
              </div>
              <span className="text-xs text-gray-600 group-hover:text-gray-900 text-center truncate max-w-[64px] leading-tight">
                {link.title || getDomainFromUrl(link.url)}
              </span>
            </a>
          );
        })}
      </div>

      {/* Scroll dots indicator (mobile only) */}
      {links.length > 4 && (
        <div className="flex justify-center mt-2 space-x-1 md:hidden">
          {Array.from({ length: Math.ceil(links.length / 4) }).map((_, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-gray-300"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickLinksHorizontal;