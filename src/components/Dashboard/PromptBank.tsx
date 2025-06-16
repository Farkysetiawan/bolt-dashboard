import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, X, Copy, Star, Zap, Sparkles } from 'lucide-react';
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
      case 'work': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200';
      case 'creative': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200';
      case 'learning': return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-200';
      case 'personal': return 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-200';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return '💼';
      case 'creative': return '🎨';
      case 'learning': return '📚';
      case 'personal': return '👤';
      default: return '💡';
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-yellow-900 dark:to-orange-900 rounded-2xl shadow-xl p-4 lg:p-6 border-2 border-yellow-200 dark:border-yellow-700 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Prompt Bank
          </h2>
          <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="group relative overflow-hidden flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center space-x-2">
            <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Add Prompt</span>
          </div>
        </button>
      </div>

      {/* Enhanced Add Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 rounded-2xl border-2 border-yellow-200 dark:border-yellow-700 animate-slideDown">
          <form onSubmit={addPrompt} className="space-y-4">
            <input
              type="text"
              value={newPrompt.title}
              onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
              placeholder="💡 Enter prompt title..."
              className="w-full px-4 py-3 border-2 border-yellow-200 dark:border-yellow-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-200 dark:focus:ring-yellow-700 focus:border-yellow-500 dark:focus:border-yellow-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              required
            />
            
            <textarea
              value={newPrompt.content}
              onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
              placeholder="✨ Enter your amazing prompt content..."
              className="w-full px-4 py-3 border-2 border-yellow-200 dark:border-yellow-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-200 dark:focus:ring-yellow-700 focus:border-yellow-500 dark:focus:border-yellow-400 resize-none text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              rows={4}
              required
            />
            
            <select
              value={newPrompt.category}
              onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
              className="px-4 py-3 border-2 border-yellow-200 dark:border-yellow-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-200 dark:focus:ring-yellow-700 focus:border-yellow-500 dark:focus:border-yellow-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
            >
              <option value="general">💡 General</option>
              <option value="work">💼 Work</option>
              <option value="creative">🎨 Creative</option>
              <option value="learning">📚 Learning</option>
              <option value="personal">👤 Personal</option>
            </select>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-bold"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">🚀 Add Prompt</div>
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

      {/* Enhanced Prompts List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {prompts.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 rounded-2xl border-2 border-dashed border-yellow-300 dark:border-yellow-600">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Lightbulb className="w-10 h-10 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">No prompts yet</p>
            <p className="text-gray-500 dark:text-gray-400">Add some prompts above to get started! 💡</p>
          </div>
        ) : (
          prompts.map((prompt, index) => (
            <div
              key={prompt.id}
              className="group relative overflow-hidden p-4 border-2 border-yellow-200 dark:border-yellow-700 rounded-2xl hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-300 bg-gradient-to-r from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] animate-slideIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="text-xl">{getCategoryIcon(prompt.category)}</div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
                    {prompt.title}
                  </h3>
                  <span className={`px-3 py-1 text-xs rounded-xl font-bold flex-shrink-0 transition-all duration-300 transform hover:scale-105 ${getCategoryColor(prompt.category)}`}>
                    {prompt.category}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(prompt.content, prompt.id)}
                    className="group/copy relative overflow-hidden p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-110"
                    title="Copy to clipboard"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover/copy:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Copy className="w-4 h-4 group-hover/copy:rotate-12 transition-transform duration-300" />
                    </div>
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-xl transition-all duration-300 transform hover:scale-110"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3 p-3 bg-gradient-to-r from-gray-50 to-yellow-50 dark:from-gray-700 dark:to-yellow-800 rounded-xl border border-gray-200 dark:border-gray-600">
                {prompt.content}
              </p>
              
              {copiedId === prompt.id && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm font-bold animate-bounce">
                  <Zap className="w-4 h-4" />
                  <span>✅ Copied to clipboard!</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PromptBank;