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
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center hover-scale">
            <GraduationCap className="w-3 h-3 text-white" />
          </div>
          <h2 className="card-title">Learning Goals</h2>
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
          <form onSubmit={addGoal} className="space-y-3">
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
      <div className="space-y-2.5">
        {goals.length === 0 ? (
          <div className="text-center py-6 text-gray-500 animate-fadeIn">
            <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">No learning goals yet. Set one above!</p>
          </div>
        ) : (
          goals.map((goal, index) => (
            <div
              key={goal.id}
              className={`p-3 border rounded-lg transition-all duration-200 hover-lift stagger-item ${
                goal.completed
                  ? 'bg-green-50 border-green-200'
                  : isOverdue(goal.target_date)
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleGoal(goal.id, goal.completed)}
                    className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 hover-scale ${
                      goal.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {goal.completed && <Target className="w-2.5 h-2.5" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium mb-1 text-xs ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className={`text-xs mb-1.5 ${goal.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {goal.description}
                      </p>
                    )}
                    {goal.target_date && (
                      <p className={`text-xs flex items-center ${
                        goal.completed
                          ? 'text-gray-400'
                          : isOverdue(goal.target_date)
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        <Target className="w-2.5 h-2.5 mr-1" />
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                        {isOverdue(goal.target_date) && !goal.completed && ' (Overdue)'}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors hover-scale"
                >
                  <X className="w-3 h-3" />
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