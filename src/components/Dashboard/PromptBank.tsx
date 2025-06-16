import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, X, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
}

const PromptBank: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    content: '',
    category: 'general',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user]);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const addPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.title.trim() || !newPrompt.content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert([
          {
            ...newPrompt,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setPrompts([data, ...prompts]);
      setNewPrompt({ title: '', content: '', category: 'general' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding prompt:', error);
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPrompts(prompts.filter(prompt => prompt.id !== id));
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'work': return 'badge badge-info';
      case 'creative': return 'badge bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'learning': return 'badge badge-success';
      case 'personal': return 'badge bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'badge badge-gray';
    }
  };

  return (
    <div className="card animate-fadeIn">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <h2 className="card-title">Prompt Bank</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Prompt
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <form onSubmit={addPrompt} className="space-y-4">
            <input
              type="text"
              value={newPrompt.title}
              onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
              placeholder="Prompt title..."
              className="input"
              required
            />
            
            <textarea
              value={newPrompt.content}
              onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
              placeholder="Prompt content..."
              className="textarea"
              rows={3}
              required
            />
            
            <select
              value={newPrompt.category}
              onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
              className="input"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="creative">Creative</option>
              <option value="learning">Learning</option>
              <option value="personal">Personal</option>
            </select>
            
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                Add Prompt
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

      {/* Prompts List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {prompts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
            <p>No prompts yet. Add some above!</p>
          </div>
        ) : (
          prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 truncate">{prompt.title}</h3>
                  <span className={getCategoryBadge(prompt.category)}>
                    {prompt.category}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(prompt.content, prompt.id)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{prompt.content}</p>
              
              {copiedId === prompt.id && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">Copied to clipboard!</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PromptBank;