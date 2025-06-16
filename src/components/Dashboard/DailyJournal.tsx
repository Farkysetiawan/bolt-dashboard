import React, { useState, useEffect } from 'react';
import { BookOpen, Save } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
          <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-purple-600" />
          Daily Journal
        </h2>
        {lastSaved && (
          <span className="text-xs text-gray-500">
            Saved {format(lastSaved, 'HH:mm')}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
        
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="How was your day? What are you thinking about?"
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm lg:text-base"
        />
        
        <button
          onClick={saveEntry}
          disabled={saving || !entry.trim()}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm lg:text-base"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Entry'}</span>
        </button>
      </div>
    </div>
  );
};

export default DailyJournal;