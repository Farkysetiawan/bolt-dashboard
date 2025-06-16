import React, { useState, useEffect } from 'react';
import { Play, Plus, X, Clock } from 'lucide-react';
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
      case 'completed': return 'text-green-600 bg-green-50';
      case 'watching': return 'text-blue-600 bg-blue-50';
      case 'planned': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
          <Play className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-green-600" />
          Content Tracker
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
          <span>Add Content</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addItem} className="mb-4 lg:mb-6 p-3 lg:p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="Content title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm lg:text-base"
              required
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as ContentItem['type'] })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm lg:text-base"
              >
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="book">Book</option>
                <option value="podcast">Podcast</option>
              </select>
              
              <select
                value={newItem.status}
                onChange={(e) => setNewItem({ ...newItem, status: e.target.value as ContentItem['status'] })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm lg:text-base"
              >
                <option value="planned">Planned</option>
                <option value="watching">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm lg:text-base"
              >
                Add
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

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No content tracked yet. Add some above!</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-3 lg:p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className="text-lg flex-shrink-0">{getTypeIcon(item.type)}</span>
                  <h3 className="font-medium text-gray-900 text-sm lg:text-base truncate">{item.title}</h3>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.progress}
                  onChange={(e) => updateProgress(item.id, parseInt(e.target.value) || 0)}
                  className="w-12 lg:w-16 px-1 lg:px-2 py-1 text-xs lg:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <span className="text-xs lg:text-sm text-gray-500">%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentTracker;