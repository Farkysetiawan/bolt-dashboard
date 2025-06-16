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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'creative': return 'bg-purple-100 text-purple-800';
      case 'learning': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
          <Lightbulb className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-yellow-600" />
          Prompt Bank
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
          <span>Add Prompt</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addPrompt} className="mb-4 p-3 lg:p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <input
              type="text"
              value={newPrompt.title}
              onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
              placeholder="Prompt title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm lg:text-base"
              required
            />
            
            <textarea
              value={newPrompt.content}
              onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
              placeholder="Prompt content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none text-sm lg:text-base"
              rows={3}
              required
            />
            
            <select
              value={newPrompt.category}
              onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm lg:text-base"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="creative">Creative</option>
              <option value="learning">Learning</option>
              <option value="personal">Personal</option>
            </select>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm lg:text-base"
              >
                Add Prompt
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

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {prompts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No prompts yet. Add some above!</p>
        ) : (
          prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{prompt.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${getCategoryColor(prompt.category)}`}>
                    {prompt.category}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(prompt.content, prompt.id)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">{prompt.content}</p>
              
              {copiedId === prompt.id && (
                <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PromptBank;