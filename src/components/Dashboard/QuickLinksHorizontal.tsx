import React, { useState, useEffect } from 'react';
import { Link, Plus, ExternalLink } from 'lucide-react';
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

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
    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
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
  );
};

export default QuickLinksHorizontal;