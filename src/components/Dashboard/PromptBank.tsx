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
      case 'creative': return 'badge bg-purple-100 text-purple-800';
      case 'learning': return 'badge badge-success';
      case 'personal': return 'badge bg-pink-100 text-pink-800';
      default: return 'badge badge-gray';
    }
  };

  return (
    <div className="card animate-fadeIn">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center hover-scale">
            <Lightbulb className="w-3 h-3 text-white" />
          </div>
          <h2 className="card-title">Prompt Bank</h2>
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
          <form onSubmit={addPrompt} className="space-y-3">
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
      <div className="space-y-2.5 max-h-80 overflow-y-auto">
        {prompts.length === 0 ? (
          <div className="text-center py-6 text-gray-500 animate-fadeIn">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">No prompts yet. Add some above!</p>
          </div>
        ) : (
          prompts.map((prompt, index) => (
            <div
              key={prompt.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 hover-lift stagger-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate text-xs">{prompt.title}</h3>
                  <span className={getCategoryBadge(prompt.category)}>
                    {prompt.category}
                  </span>
                </div>
                
                <div className="flex items-center space-x-0.5 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(prompt.content, prompt.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 hover-scale"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover-scale"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 leading-relaxed">{prompt.content}</p>
              
              {copiedId === prompt.id && (
                <p className="text-xs text-green-600 mt-1.5 animate-fadeIn">Copied to clipboard!</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PromptBank;