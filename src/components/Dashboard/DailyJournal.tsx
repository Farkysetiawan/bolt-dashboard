import React, { useState, useEffect } from 'react';
import { BookOpen, Save, Sparkles, Heart, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  content: string;
  date: string;
  user_id: string;
}

const DailyJournal: React.FC = () => {
  const [entry, setEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      fetchTodayEntry();
    }
  }, [user]);

  const fetchTodayEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setEntry(data[0].content);
      } else {
        setEntry('');
      }
    } catch (error) {
      console.error('Error fetching journal entry:', error);
    }
  };

  const saveEntry = async () => {
    if (!entry.trim()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('journal_entries')
        .upsert({
          content: entry,
          date: today,
          user_id: user?.id,
        });

      if (error) throw error;
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900 rounded-2xl shadow-xl p-4 lg:p-6 border-2 border-purple-200 dark:border-purple-700 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Daily Journal
          </h2>
          <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
        </div>
        {lastSaved && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">
            <Heart className="w-3 h-3" />
            <span>Saved {format(lastSaved, 'HH:mm')}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Enhanced Date Display */}
        <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 rounded-xl border border-purple-200 dark:border-purple-600">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            <span className="text-lg font-bold text-purple-800 dark:text-purple-200">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
        </div>
        
        {/* Enhanced Textarea */}
        <div className="relative">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="✨ How was your day? What are you thinking about? Share your thoughts, dreams, and reflections..."
            className="w-full h-40 px-4 py-4 border-2 border-purple-200 dark:border-purple-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-700 focus:border-purple-500 dark:focus:border-purple-400 resize-none text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-purple-400 dark:placeholder-purple-500 transition-all duration-300"
          />
          <div className="absolute bottom-3 right-3 text-xs text-purple-500 dark:text-purple-400">
            {entry.length} characters
          </div>
        </div>
        
        {/* Enhanced Save Button */}
        <button
          onClick={saveEntry}
          disabled={saving || !entry.trim()}
          className="group relative overflow-hidden w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-600 to-red-500 text-white rounded-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-bold"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-red-600 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center space-x-3">
            <Save className={`w-5 h-5 transition-transform duration-300 ${saving ? 'animate-spin' : 'group-hover:rotate-12'}`} />
            <span className="text-lg">
              {saving ? '💾 Saving your thoughts...' : '✨ Save Entry'}
            </span>
          </div>
        </button>

        {/* Motivational Quote */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-xl border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-center text-blue-700 dark:text-blue-300 italic">
            "📝 Every day is a new page in your story. Make it beautiful! ✨"
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyJournal;