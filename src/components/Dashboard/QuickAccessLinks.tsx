import React, { useState, useEffect } from 'react';
import { Link, Plus, X, ExternalLink, Star, Zap, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface QuickLink {
  id: string;
  title: string;
  url: string;
  user_id: string;
}

const QuickAccessLinks: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
  });
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching quick links:', error);
    }
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    // Add https:// if no protocol is specified
    let url = newLink.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const { data, error } = await supabase
        .from('quick_links')
        .insert([
          {
            title: newLink.title.trim(),
            url: url,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setLinks([data, ...links]);
      setNewLink({ title: '', url: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding quick link:', error);
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quick_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLinks(links.filter(link => link.id !== id));
    } catch (error) {
      console.error('Error deleting quick link:', error);
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 rounded-2xl shadow-xl p-4 lg:p-6 border-2 border-orange-200 dark:border-orange-700 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <Link className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Quick Links
          </h2>
          <Star className="w-5 h-5 text-orange-500 animate-pulse" />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="group relative overflow-hidden flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center space-x-2">
            <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Add Link</span>
          </div>
        </button>
      </div>

      {/* Enhanced Add Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900 rounded-2xl border-2 border-orange-200 dark:border-orange-700 animate-slideDown">
          <form onSubmit={addLink} className="space-y-4">
            <input
              type="text"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="🔗 Enter link title..."
              className="w-full px-4 py-3 border-2 border-orange-200 dark:border-orange-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-700 focus:border-orange-500 dark:focus:border-orange-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              required
            />
            
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="🌐 https://example.com"
              className="w-full px-4 py-3 border-2 border-orange-200 dark:border-orange-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-700 focus:border-orange-500 dark:focus:border-orange-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              required
            />
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-bold"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">🚀 Add Link</div>
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enhanced Links List */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-600">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Link className="w-10 h-10 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">No quick links yet</p>
            <p className="text-gray-500 dark:text-gray-400">Add some links above for quick access! ⚡</p>
          </div>
        ) : (
          links.map((link, index) => (
            <div
              key={link.id}
              className="group relative overflow-hidden flex items-center justify-between p-4 border-2 border-orange-200 dark:border-orange-700 rounded-2xl hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 bg-gradient-to-r from-white to-orange-50 dark:from-gray-800 dark:to-orange-900 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] animate-slideIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-4 flex-1 text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 min-w-0 group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {getDomainFromUrl(link.url)}
                  </p>
                </div>
                
                <div className="flex-shrink-0 flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5 text-orange-500 group-hover:rotate-12 transition-transform duration-300" />
                  <Zap className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </a>
              
              <button
                onClick={() => deleteLink(link.id)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-xl transition-all duration-300 transform hover:scale-110 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuickAccessLinks;