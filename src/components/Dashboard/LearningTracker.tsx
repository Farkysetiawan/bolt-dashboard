import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, X, Target, Star, Trophy, Calendar, Zap } from 'lucide-react';
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

  const getDaysUntilTarget = (targetDate: string) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 rounded-2xl shadow-xl p-4 lg:p-6 border-2 border-indigo-200 dark:border-indigo-700 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Learning Goals
          </h2>
          <Star className="w-5 h-5 text-indigo-500 animate-pulse" />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="group relative overflow-hidden flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center space-x-2">
            <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Add Goal</span>
          </div>
        </button>
      </div>

      {/* Enhanced Add Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 animate-slideDown">
          <form onSubmit={addGoal} className="space-y-4">
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="🎯 Enter your learning goal..."
              className="w-full px-4 py-3 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              required
            />
            
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              placeholder="📝 Describe your goal (optional)..."
              className="w-full px-4 py-3 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:border-indigo-500 dark:focus:border-indigo-400 resize-none text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
              rows={3}
            />
            
            <input
              type="date"
              value={newGoal.target_date}
              onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              className="px-4 py-3 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm lg:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 transition-all duration-300"
            />
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-bold"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">🚀 Add Goal</div>
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

      {/* Enhanced Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-600">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">No learning goals yet</p>
            <p className="text-gray-500 dark:text-gray-400">Set one above to start your learning journey! 🌟</p>
          </div>
        ) : (
          goals.map((goal, index) => {
            const daysUntilTarget = getDaysUntilTarget(goal.target_date);
            return (
              <div
                key={goal.id}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl animate-slideIn ${
                  goal.completed
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border-green-200 dark:border-green-700 shadow-lg shadow-green-100'
                    : isOverdue(goal.target_date)
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900 dark:to-pink-900 border-red-200 dark:border-red-700 shadow-lg shadow-red-100'
                    : 'bg-gradient-to-r from-white via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-indigo-900 dark:to-purple-900 border-indigo-200 dark:border-indigo-700 shadow-lg shadow-indigo-100'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <button
                        onClick={() => toggleGoal(goal.id, goal.completed)}
                        className={`flex-shrink-0 w-7 h-7 rounded-full border-3 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                          goal.completed
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-200'
                            : 'border-indigo-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900'
                        }`}
                      >
                        {goal.completed && <Target className="w-4 h-4 animate-bounce" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg mb-2 transition-all duration-300 ${
                          goal.completed
                            ? 'text-gray-500 dark:text-gray-400 line-through'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {goal.title}
                        </h3>
                        
                        {goal.description && (
                          <p className={`text-sm mb-3 transition-all duration-300 ${
                            goal.completed
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {goal.description}
                          </p>
                        )}
                        
                        {goal.target_date && (
                          <div className="flex items-center space-x-2">
                            <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-bold ${
                              goal.completed
                                ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                                : isOverdue(goal.target_date)
                                ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                                : daysUntilTarget !== null && daysUntilTarget <= 7
                                ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300'
                                : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                            }`}>
                              <Calendar className="w-4 h-4" />
                              <span>
                                {goal.completed
                                  ? '✅ Completed'
                                  : isOverdue(goal.target_date)
                                  ? '⚠️ Overdue'
                                  : daysUntilTarget !== null
                                  ? daysUntilTarget === 0
                                    ? '🎯 Due Today'
                                    : daysUntilTarget > 0
                                    ? `📅 ${daysUntilTarget} days left`
                                    : '⚠️ Overdue'
                                  : new Date(goal.target_date).toLocaleDateString()
                                }
                              </span>
                            </div>
                            
                            {goal.completed && (
                              <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />
                            )}
                            {!goal.completed && daysUntilTarget !== null && daysUntilTarget <= 3 && daysUntilTarget > 0 && (
                              <Zap className="w-5 h-5 text-orange-500 animate-pulse" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-xl transition-all duration-300 transform hover:scale-110"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LearningTracker;