import React, { useState, useEffect } from 'react';
import { Link, Plus, X, ExternalLink } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
          <Link className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-orange-600" />
          Quick Links
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
          <span>Add Link</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addLink} className="mb-4 p-3 lg:p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <input
              type="text"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="Link title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm lg:text-base"
              required
            />
            
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm lg:text-base"
              required
            />
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm lg:text-base"
              >
                Add Link
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm lg:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No quick links yet. Add some above!</p>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 flex-1 text-gray-900 hover:text-orange-600 transition-colors min-w-0"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm lg:text-base">{link.title}</span>
              </a>
              
              <button
                onClick={() => deleteLink(link.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
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