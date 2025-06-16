import React, { useState, useEffect } from 'react';
import { Play, Plus, X, Clock, Star, Zap, Target, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'article' | 'book' | 'podcast';
  status: 'watching' | 'completed' | 'planned';
  progress: number;
  user_id: string;
}

const ContentTracker: React.FC = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    type: 'video' as ContentItem['type'],
    status: 'planned' as ContentItem['status'],
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('content_items')
        .insert([
          {
            ...newItem,
            progress: 0,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setItems([data, ...items]);
      setNewItem({ title: '', type: 'video', status: 'planned' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding content item:', error);
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    try {
      const status = progress >= 100 ? 'completed' : 'watching';
      const { error } = await supabase
        .from('content_items')
        .update({ progress, status })
        .eq('id', id);

      if (error) throw error;
      setItems(items.map(item => 
        item.id === id ? { ...item, progress, status } : item
      ));
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting content item:', error);
    }
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'book': return '📚';
      case 'podcast': return '🎧';
      default: return '📄';
    }
  };

  const getStatusColor = (status: ContentItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200';
      case 'watching': return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200';
      case 'planned': return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-200';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'from-green-500 to-emerald-600';
    if (progress >= 75) return 'from-blue-500 to-purple-600';
    if (progress >= 50) return 'from-yellow-500 to-orange-600';
    if (progress >= 25) return 'from-orange-500 to-red-600';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <div className="bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-gray-900 dark:via-green-900 dark:to-emerald-900 rounded-2xl shadow-xl p-4 lg:p-6 border-2 border-green-200 dark:border-green-700 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Content Tracker
          </h2>
          <Star className="w-5 h-5 text-green-500 animate-pulse" />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="group relative overflow-hidden flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center space-x-2">
            <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Add Content</span>
          </div>
        </button>
      </div>

      {/* Enhanced Add Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-2xl border-2 border-green-200 dark:border-green-700 animate-slideDown">
          <form onSubmit={addItem} className="space-y-4">
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="✨ Enter content title..."
              className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-700 focus:border-green-500 dark:focus:border-green-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              required
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as ContentItem['type'] })}
                className="px-4 py-3 border-2 border-green-200 dark:border-green-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-700 focus:border-green-500 dark:focus:border-green-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              >
                <option value="video">🎥 Video</option>
                <option value="article">📄 Article</option>
                <option value="book">📚 Book</option>
                <option value="podcast">🎧 Podcast</option>
              </select>
              
              <select
                value={newItem.status}
                onChange={(e) => setNewItem({ ...newItem, status: e.target.value as ContentItem['status'] })}
                className="px-4 py-3 border-2 border-green-200 dark:border-green-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-700 focus:border-green-500 dark:focus:border-green-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              >
                <option value="planned">📋 Planned</option>
                <option value="watching">👀 In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-bold"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">🚀 Add Content</div>
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

      {/* Enhanced Content List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-2xl border-2 border-dashed border-green-300 dark:border-green-600">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Play className="w-10 h-10 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">No content tracked yet</p>
            <p className="text-gray-500 dark:text-gray-400">Add some content above to start tracking! 🎯</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="group relative overflow-hidden p-4 lg:p-5 border-2 border-green-200 dark:border-green-700 rounded-2xl hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 bg-gradient-to-r from-white to-green-50 dark:from-gray-800 dark:to-green-900 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] animate-slideIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="text-2xl flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300">
                    {getTypeIcon(item.type)}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                    {item.title}
                  </h3>
                </div>
                
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className={`px-4 py-2 text-sm rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-xl transition-all duration-300 transform hover:scale-110"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className={`h-full bg-gradient-to-r ${getProgressColor(item.progress)} transition-all duration-500 ease-out shadow-lg`}
                      style={{ width: `${item.progress}%` }}
                    >
                      <div className="h-full bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  {item.progress > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-lg">
                        {item.progress}%
                      </span>
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.progress}
                  onChange={(e) => updateProgress(item.id, parseInt(e.target.value) || 0)}
                  className="w-16 lg:w-20 px-2 py-2 text-sm border-2 border-green-200 dark:border-green-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-700 focus:border-green-500 dark:focus:border-green-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 font-bold text-center transition-all duration-300"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">%</span>
              </div>

              {/* Progress Icons */}
              <div className="mt-3 flex justify-end space-x-2">
                {item.progress >= 100 && <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />}
                {item.progress >= 75 && item.progress < 100 && <Target className="w-5 h-5 text-blue-500 animate-pulse" />}
                {item.progress >= 50 && item.progress < 75 && <Zap className="w-5 h-5 text-orange-500 animate-pulse" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentTracker;