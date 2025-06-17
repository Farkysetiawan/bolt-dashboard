import React, { useState, useEffect } from 'react';
import { Play, Plus, X } from 'lucide-react';
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

  const getStatusBadge = (status: ContentItem['status']) => {
    switch (status) {
      case 'completed': return 'badge badge-success';
      case 'watching': return 'badge badge-info';
      case 'planned': return 'badge badge-gray';
      default: return 'badge badge-gray';
    }
  };

  return (
    <div className="card animate-fadeIn">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center hover-scale">
            <Play className="w-3 h-3 text-white" />
          </div>
          <h2 className="card-title">Content Tracker</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-icon-primary"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-slideDown">
          <form onSubmit={addItem} className="space-y-3">
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="Content title..."
              className="input"
              required
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as ContentItem['type'] })}
                className="input"
              >
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="book">Book</option>
                <option value="podcast">Podcast</option>
              </select>
              
              <select
                value={newItem.status}
                onChange={(e) => setNewItem({ ...newItem, status: e.target.value as ContentItem['status'] })}
                className="input"
              >
                <option value="planned">Planned</option>
                <option value="watching">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                Add
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

      {/* Content List */}
      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="text-center py-6 text-gray-500 animate-fadeIn">
            <Play className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">No content tracked yet. Add some above!</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 hover-lift stagger-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className="text-base">{getTypeIcon(item.type)}</span>
                  <h3 className="font-medium text-gray-900 truncate text-xs">{item.title}</h3>
                </div>
                
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <span className={getStatusBadge(item.status)}>
                    {item.status}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors hover-scale"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.progress}
                  onChange={(e) => updateProgress(item.id, parseInt(e.target.value) || 0)}
                  className="w-12 px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentTracker;