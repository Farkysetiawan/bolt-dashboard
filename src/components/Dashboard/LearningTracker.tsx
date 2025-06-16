import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, X, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  target_date: string;
  completed: boolean;
  user_id: string;
}

const LearningTracker: React.FC = () => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('target_date', { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching learning goals:', error);
    }
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .insert([
          {
            ...newGoal,
            completed: false,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setGoals([...goals, data]);
      setNewGoal({ title: '', description: '', target_date: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding learning goal:', error);
    }
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('learning_goals')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
      setGoals(goals.map(goal => 
        goal.id === id ? { ...goal, completed: !completed } : goal
      ));
    } catch (error) {
      console.error('Error updating learning goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('learning_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGoals(goals.filter(goal => goal.id !== id));
    } catch (error) {
      console.error('Error deleting learning goal:', error);
    }
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date() && targetDate !== '';
  };

  return (
    <div className="card animate-fadeIn">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <h2 className="card-title">Learning Goals</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <form onSubmit={addGoal} className="space-y-4">
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="Learning goal title..."
              className="input"
              required
            />
            
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              placeholder="Description (optional)..."
              className="textarea"
              rows={2}
            />
            
            <input
              type="date"
              value={newGoal.target_date}
              onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              className="input"
            />
            
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                Add Goal
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

      {/* Goals List */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
            <p>No learning goals yet. Set one above!</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className={`p-4 border rounded-lg transition-colors ${
                goal.completed
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                  : isOverdue(goal.target_date)
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleGoal(goal.id, goal.completed)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      goal.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-slate-600 hover:border-blue-500'
                    }`}
                  >
                    {goal.completed && <Target className="w-3 h-3" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium mb-1 ${goal.completed ? 'text-gray-500 dark:text-slate-400 line-through' : 'text-gray-900 dark:text-slate-100'}`}>
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className={`text-sm mb-2 ${goal.completed ? 'text-gray-400 dark:text-slate-500' : 'text-gray-600 dark:text-slate-400'}`}>
                        {goal.description}
                      </p>
                    )}
                    {goal.target_date && (
                      <p className={`text-xs flex items-center ${
                        goal.completed
                          ? 'text-gray-400 dark:text-slate-500'
                          : isOverdue(goal.target_date)
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-slate-400'
                      }`}>
                        <Target className="w-3 h-3 mr-1" />
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                        {isOverdue(goal.target_date) && !goal.completed && ' (Overdue)'}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LearningTracker;