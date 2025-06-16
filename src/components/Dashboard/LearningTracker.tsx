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
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
          <GraduationCap className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-indigo-600" />
          Learning Goals
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addGoal} className="mb-4 lg:mb-6 p-3 lg:p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="Learning goal title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
              required
            />
            
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              placeholder="Description (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm lg:text-base"
              rows={2}
            />
            
            <input
              type="date"
              value={newGoal.target_date}
              onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
            />
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm lg:text-base"
              >
                Add Goal
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

      <div className="space-y-3">
        {goals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No learning goals yet. Set one above!</p>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className={`p-3 lg:p-4 border rounded-lg transition-colors ${
                goal.completed
                  ? 'bg-green-50 border-green-200'
                  : isOverdue(goal.target_date)
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleGoal(goal.id, goal.completed)}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      goal.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}
                  >
                    {goal.completed && <Target className="w-3 h-3" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-sm lg:text-base ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className={`text-xs lg:text-sm mt-1 ${goal.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {goal.description}
                      </p>
                    )}
                    {goal.target_date && (
                      <p className={`text-xs mt-2 flex items-center ${
                        goal.completed
                          ? 'text-gray-400'
                          : isOverdue(goal.target_date)
                          ? 'text-red-600'
                          : 'text-gray-500'
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