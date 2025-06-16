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
    <div className="card animate-fadeIn">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <h2 className="card-title">Daily Journal</h2>
        </div>
        {lastSaved && (
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Saved {format(lastSaved, 'HH:mm')}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Date */}
        <div className="text-sm text-gray-600 dark:text-slate-400">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
        
        {/* Textarea */}
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="How was your day? What are you thinking about?"
          className="textarea h-32"
        />
        
        {/* Save Button */}
        <button
          onClick={saveEntry}
          disabled={saving || !entry.trim()}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
};

export default DailyJournal;