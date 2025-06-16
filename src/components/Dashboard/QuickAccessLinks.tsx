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
    <div className="card animate-fadeIn">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Link className="w-4 h-4 text-white" />
          </div>
          <h2 className="card-title">Quick Links</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <form onSubmit={addLink} className="space-y-4">
            <input
              type="text"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="Link title..."
              className="input"
              required
            />
            
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://example.com"
              className="input"
              required
            />
            
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                Add Link
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Links List */}
      <div className="space-y-2">
        {links.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <Link className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
            <p>No quick links yet. Add some above!</p>
          </div>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 flex-1 text-gray-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{link.title}</span>
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