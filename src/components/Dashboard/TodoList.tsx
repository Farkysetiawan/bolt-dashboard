import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Clock, Calendar, ChevronLeft, ChevronRight, Play, Pause, Square, Trophy, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, isToday, startOfMonth, endOfMonth } from 'date-fns';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  user_id: string;
  date: string;
  priority_score?: number;
  urgency?: number;
  importance?: number;
  effort?: number;
  impact?: number;
  duration_minutes?: number;
  actual_minutes?: number;
  timer_start_time?: string;
  is_timer_active?: boolean;
}

interface PriorityForm {
  urgency: number;
  importance: number;
  effort: number;
  impact: number;
  duration_minutes: number;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPriorityForm, setShowPriorityForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [priorityForm, setPriorityForm] = useState<PriorityForm>({
    urgency: 5,
    importance: 5,
    effort: 5,
    impact: 5,
    duration_minutes: 30
  });
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTodos();
      checkActiveTimer();
    }
  }, [user, selectedDate]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const checkActiveTimer = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_timer_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setActiveTimer(data.id);
        const startTime = new Date(data.timer_start_time);
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setTimerSeconds(elapsedSeconds);
      }
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const fetchTodos = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', dateStr)
        .order('priority_score', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePriorityScore = (form: PriorityForm): number => {
    const { urgency, importance, effort, impact } = form;
    
    // SIMPLE Priority Calculation Model - NO BONUSES
    // 4 factors with equal weight: 25% each
    
    // 1. Urgency Score (1-10) - 25%
    const urgencyScore = urgency * 0.25;
    
    // 2. Importance Score (1-10) - 25%
    const importanceScore = importance * 0.25;
    
    // 3. Impact Score (1-10) - 25%
    const impactScore = impact * 0.25;
    
    // 4. Effort Score (1-10, NOT inverted) - 25%
    const effortScore = effort * 0.25;
    
    // 5. Simple sum of all weighted scores - NO BONUSES
    const finalScore = urgencyScore + importanceScore + impactScore + effortScore;
    
    // Final normalization and rounding
    const normalizedScore = Math.min(Math.max(finalScore, 0.1), 10.0);
    
    // Round to 1 decimal place for consistency
    return Math.round(normalizedScore * 10) / 10;
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const priorityScore = calculatePriorityScore(priorityForm);
      
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodo.trim(),
            completed: false,
            user_id: user?.id,
            date: dateStr,
            urgency: priorityForm.urgency,
            importance: priorityForm.importance,
            effort: priorityForm.effort,
            impact: priorityForm.impact,
            duration_minutes: priorityForm.duration_minutes,
            priority_score: priorityScore,
            actual_minutes: 0,
            is_timer_active: false
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setTodos([data, ...todos]);
      setNewTodo('');
      setShowPriorityForm(false);
      // Reset form to defaults
      setPriorityForm({
        urgency: 5,
        importance: 5,
        effort: 5,
        impact: 5,
        duration_minutes: 30
      });
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const startTimer = async (todoId: string) => {
    try {
      // Stop any existing timer first
      if (activeTimer) {
        await pauseTimer(activeTimer);
      }

      const { error } = await supabase
        .from('todos')
        .update({
          timer_start_time: new Date().toISOString(),
          is_timer_active: true
        })
        .eq('id', todoId);

      if (error) throw error;
      
      setActiveTimer(todoId);
      setTimerSeconds(0);
      fetchTodos();
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const pauseTimer = async (todoId: string) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const currentActualMinutes = todo.actual_minutes || 0;
      // Convert seconds to minutes with decimal precision (to 2 decimal places)
      const additionalMinutes = Math.round((timerSeconds / 60) * 100) / 100;
      const newActualMinutes = Math.round((currentActualMinutes + additionalMinutes) * 100) / 100;

      const { error } = await supabase
        .from('todos')
        .update({
          actual_minutes: newActualMinutes,
          is_timer_active: false,
          timer_start_time: null
        })
        .eq('id', todoId);

      if (error) throw error;
      
      setActiveTimer(null);
      setTimerSeconds(0);
      fetchTodos();
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };

  const finishTask = async (todoId: string) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      let finalActualMinutes = todo.actual_minutes || 0;
      
      // If timer is active, add current timer time with second precision
      if (activeTimer === todoId) {
        const additionalMinutes = Math.round((timerSeconds / 60) * 100) / 100;
        finalActualMinutes = Math.round((finalActualMinutes + additionalMinutes) * 100) / 100;
      }

      const { error } = await supabase
        .from('todos')
        .update({
          completed: true,
          actual_minutes: finalActualMinutes,
          is_timer_active: false,
          timer_start_time: null
        })
        .eq('id', todoId);

      if (error) throw error;
      
      if (activeTimer === todoId) {
        setActiveTimer(null);
        setTimerSeconds(0);
      }
      
      fetchTodos();
    } catch (error) {
      console.error('Error finishing task:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number): string => {
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    }
    if (minutes < 60) {
      // Show decimal minutes for precision
      return minutes % 1 === 0 ? `${minutes}m` : `${minutes.toFixed(1)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round((minutes % 60) * 10) / 10;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Generate calendar days for current week
  const generateWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  const weekDays = generateWeekDays();

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Stats calculation with improved point system
  const getMonthlyStats = async () => {
    try {
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('completed', true);

      if (error) throw error;

      const completedTodos = data || [];
      
      // Improved Points Calculation
      const totalPoints = completedTodos.reduce((sum, todo) => {
        let basePoints = todo.priority_score || 0;
        
        // Time efficiency bonus/penalty system
        if (todo.duration_minutes && todo.actual_minutes !== null) {
          const timeUsageRatio = todo.actual_minutes / todo.duration_minutes;
          
          if (timeUsageRatio <= 0.8) {
            // Finished 20% faster or more - efficiency bonus
            basePoints *= 1.3;
          } else if (timeUsageRatio <= 1.0) {
            // Finished on time or slightly faster - small bonus
            basePoints *= 1.1;
          } else if (timeUsageRatio <= 1.5) {
            // Took up to 50% longer - no penalty (normal)
            basePoints *= 1.0;
          } else if (timeUsageRatio <= 2.0) {
            // Took up to 100% longer - small penalty
            basePoints *= 0.9;
          } else {
            // Took more than 2x time - larger penalty
            basePoints *= 0.7;
          }
        }
        
        return sum + basePoints;
      }, 0);

      const totalCompleted = completedTodos.length;
      const averageScore = totalCompleted > 0 ? totalPoints / totalCompleted : 0;
      
      const totalEstimated = completedTodos.reduce((sum, todo) => sum + (todo.duration_minutes || 0), 0);
      const totalActual = completedTodos.reduce((sum, todo) => sum + (todo.actual_minutes || 0), 0);
      
      // Improved Time Usage Calculation
      let timeUsage = 0;
      let usageLabel = 'No data';
      
      if (totalEstimated > 0 && totalActual >= 0) {
        timeUsage = (totalActual / totalEstimated) * 100;
        
        // Updated effort level labels based on time investment
        if (timeUsage < 50) {
          usageLabel = '😔 Poor Effort';
        } else if (timeUsage >= 50 && timeUsage < 75) {
          usageLabel = '⚠️ Below Standard';
        } else if (timeUsage >= 75 && timeUsage <= 100) {
          usageLabel = '👍 Standard';
        } else if (timeUsage > 100 && timeUsage <= 150) {
          usageLabel = '🌟 Excellent';
        } else if (timeUsage > 150) {
          usageLabel = '🔥 Outstanding';
        }
      } else if (totalEstimated === 0) {
        usageLabel = 'No estimates';
      }

      return {
        totalPoints: Math.round(totalPoints * 10) / 10, // Round to 1 decimal
        totalCompleted,
        averageScore: Math.round(averageScore * 10) / 10,
        timeUsage: Math.round(timeUsage),
        usageLabel,
        totalEstimated,
        totalActual
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalPoints: 0,
        totalCompleted: 0,
        averageScore: 0,
        timeUsage: 0,
        usageLabel: 'No data',
        totalEstimated: 0,
        totalActual: 0
      };
    }
  };

  const [monthlyStats, setMonthlyStats] = useState({
    totalPoints: 0,
    totalCompleted: 0,
    averageScore: 0,
    timeUsage: 0,
    usageLabel: 'No data',
    totalEstimated: 0,
    totalActual: 0
  });

  useEffect(() => {
    if (user && showStats) {
      getMonthlyStats().then(setMonthlyStats);
    }
  }, [user, showStats, todos]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-2 sm:space-y-0">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
          <Clock className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-blue-600" />
          Smart Todo List
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors ${
              showStats 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            <Trophy className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Points & Stats</span>
            <span className="sm:hidden">Stats</span>
          </button>
          <span className="text-xs lg:text-sm text-gray-500">
            {todos.filter(t => !t.completed).length} pending
          </span>
        </div>
      </div>

      {/* Performance Dashboard */}
      {showStats && (
        <div className="mb-4 lg:mb-6 p-4 lg:p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
          <div className="flex items-center mb-4">
            <Trophy className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-purple-600" />
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">Performance Dashboard - {format(new Date(), 'MMMM yyyy')}</h3>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
            <div className="bg-white rounded-lg p-3 lg:p-4 text-center shadow-sm">
              <div className="text-lg lg:text-2xl font-bold text-purple-600">{monthlyStats.totalPoints}</div>
              <div className="text-xs lg:text-sm text-gray-600">Total Points</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
            <div className="bg-white rounded-lg p-3 lg:p-4 text-center shadow-sm">
              <div className="text-lg lg:text-2xl font-bold text-blue-600">{monthlyStats.totalCompleted}</div>
              <div className="text-xs lg:text-sm text-gray-600">Tasks Completed</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
            <div className="bg-white rounded-lg p-3 lg:p-4 text-center shadow-sm">
              <div className="text-lg lg:text-2xl font-bold text-green-600">{monthlyStats.averageScore}</div>
              <div className="text-xs lg:text-sm text-gray-600">Average Score</div>
              <div className="text-xs text-gray-500">Per Task</div>
            </div>
            <div className="bg-white rounded-lg p-3 lg:p-4 text-center shadow-sm">
              <div className="text-lg lg:text-2xl font-bold text-orange-600">
                {monthlyStats.timeUsage > 0 ? `${monthlyStats.timeUsage}%` : 'N/A'}
              </div>
              <div className="text-xs lg:text-sm text-gray-600">Effort Level</div>
              <div className="text-xs text-gray-500">Time Investment</div>
            </div>
          </div>

          {/* Time Analysis */}
          <div className="bg-white rounded-lg p-3 lg:p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4 mr-2 text-blue-600" />
              <h4 className="text-sm lg:text-base font-medium text-gray-900">Time Analysis</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4 text-xs lg:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Time Spent:</span>
                <span className="font-medium">{formatMinutes(monthlyStats.totalActual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Time:</span>
                <span className="font-medium">{formatMinutes(monthlyStats.totalEstimated)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Effort Level:</span>
                <span className="font-medium">{monthlyStats.usageLabel}</span>
              </div>
            </div>
            
            {/* Performance Insights */}
            <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-gray-50 rounded-lg">
              <h5 className="text-xs lg:text-sm font-medium text-gray-900 mb-2">Performance Insights</h5>
              <div className="text-xs text-gray-600 space-y-1">
                {monthlyStats.totalCompleted === 0 && (
                  <p>• Start completing tasks to see your performance metrics</p>
                )}
                {monthlyStats.totalCompleted > 0 && monthlyStats.timeUsage < 50 && (
                  <p>• ⚠️ Low effort detected - you may be giving up too early or not putting in enough time</p>
                )}
                {monthlyStats.totalCompleted > 0 && monthlyStats.timeUsage >= 50 && monthlyStats.timeUsage < 75 && (
                  <p>• 📈 Below standard effort - try to invest more time to meet your estimates</p>
                )}
                {monthlyStats.totalCompleted > 0 && monthlyStats.timeUsage >= 75 && monthlyStats.timeUsage <= 100 && (
                  <p>• 👍 Standard performance - you're meeting your time estimates well</p>
                )}
                {monthlyStats.totalCompleted > 0 && monthlyStats.timeUsage > 100 && monthlyStats.timeUsage <= 150 && (
                  <p>• 🌟 Excellent effort! You're putting in extra time beyond estimates</p>
                )}
                {monthlyStats.totalCompleted > 0 && monthlyStats.timeUsage > 150 && (
                  <p>• 🔥 Outstanding dedication! You're going above and beyond on your tasks</p>
                )}
                {monthlyStats.averageScore >= 8 && (
                  <p>• High-impact task selection! You're focusing on important work</p>
                )}
                {monthlyStats.averageScore >= 6 && monthlyStats.averageScore < 8 && (
                  <p>• Balanced task prioritization with room for focusing on higher-impact items</p>
                )}
                {monthlyStats.averageScore < 6 && monthlyStats.totalCompleted > 0 && (
                  <p>• Consider prioritizing tasks with higher urgency and importance scores</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm lg:text-base font-medium">
                {format(selectedDate, 'EEE, MMM d')}
              </span>
            </button>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {!isToday(selectedDate) && (
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Week Calendar */}
        {showCalendar && (
          <div className="grid grid-cols-7 gap-1 p-3 bg-gray-50 rounded-lg">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {weekDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day);
                  setShowCalendar(false);
                }}
                className={`
                  p-2 text-sm rounded-lg transition-colors
                  ${isSameDay(day, selectedDate)
                    ? 'bg-blue-600 text-white'
                    : isToday(day)
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {format(day, 'd')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Todo Form */}
      <form onSubmit={addTodo} className="mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder={`Add a task for ${format(selectedDate, 'MMM d')}...`}
            className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          />
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowPriorityForm(!showPriorityForm)}
              className="px-3 lg:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm lg:text-base"
            >
              ⭐
            </button>
            <button
              type="submit"
              className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Priority Form */}
        {showPriorityForm && (
          <div className="p-3 lg:p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-base lg:text-lg font-medium text-purple-900 mb-4">Set Task Priority & Duration</h3>
            
            <div className="grid grid-cols-1 gap-4 lg:gap-6">
              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency (Deadline Pressure)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={priorityForm.urgency}
                    onChange={(e) => setPriorityForm({...priorityForm, urgency: parseInt(e.target.value)})}
                    className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(priorityForm.urgency - 1) * 11.11}%, #fecaca ${(priorityForm.urgency - 1) * 11.11}%, #fecaca 100%)`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span className="font-medium text-red-600">{priorityForm.urgency}</span>
                  <span>High</span>
                </div>
              </div>

              {/* Importance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Importance (Strategic Value)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={priorityForm.importance}
                    onChange={(e) => setPriorityForm({...priorityForm, importance: parseInt(e.target.value)})}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(priorityForm.importance - 1) * 11.11}%, #bfdbfe ${(priorityForm.importance - 1) * 11.11}%, #bfdbfe 100%)`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span className="font-medium text-blue-600">{priorityForm.importance}</span>
                  <span>High</span>
                </div>
              </div>

              {/* Effort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effort Required
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={priorityForm.effort}
                    onChange={(e) => setPriorityForm({...priorityForm, effort: parseInt(e.target.value)})}
                    className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #eab308 0%, #eab308 ${(priorityForm.effort - 1) * 11.11}%, #fef3c7 ${(priorityForm.effort - 1) * 11.11}%, #fef3c7 100%)`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Easy</span>
                  <span className="font-medium text-yellow-600">{priorityForm.effort}</span>
                  <span>Hard</span>
                </div>
              </div>

              {/* Impact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impact (Results)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={priorityForm.impact}
                    onChange={(e) => setPriorityForm({...priorityForm, impact: parseInt(e.target.value)})}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e ${(priorityForm.impact - 1) * 11.11}%, #bbf7d0 ${(priorityForm.impact - 1) * 11.11}%, #bbf7d0 100%)`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span className="font-medium text-green-600">{priorityForm.impact}</span>
                  <span>High</span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (minutes)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="5"
                    max="480"
                    step="5"
                    value={priorityForm.duration_minutes}
                    onChange={(e) => setPriorityForm({...priorityForm, duration_minutes: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${((priorityForm.duration_minutes - 5) / 475) * 100}%, #cbd5e1 ${((priorityForm.duration_minutes - 5) / 475) * 100}%, #cbd5e1 100%)`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5m</span>
                  <span className="font-medium text-gray-600">{formatMinutes(priorityForm.duration_minutes)}</span>
                  <span>8h</span>
                </div>
              </div>
            </div>

            {/* Priority Score Display - SIMPLIFIED */}
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Priority Score:</span>
                <span className="text-xl font-bold text-purple-600">
                  {calculatePriorityScore(priorityForm).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm lg:text-base"
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={() => setShowPriorityForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm lg:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Date Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
          </span>
          <span className="text-xs text-gray-500">
            {todos.length} {todos.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              No tasks for {isToday(selectedDate) ? 'today' : format(selectedDate, 'MMM d')}
            </p>
            <p className="text-sm text-gray-400">Add one above to get started!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-start space-x-3 p-3 lg:p-4 rounded-lg border transition-colors ${
                todo.completed
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id, todo.completed)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5 ${
                  todo.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {todo.completed && <Check className="w-3 h-3" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                  <span
                    className={`text-sm lg:text-base ${
                      todo.completed
                        ? 'text-gray-500 line-through'
                        : 'text-gray-900'
                    }`}
                  >
                    {todo.title}
                  </span>
                  {todo.priority_score && (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium flex-shrink-0 ${
                      todo.priority_score >= 8 
                        ? 'bg-red-100 text-red-700' 
                        : todo.priority_score >= 6 
                        ? 'bg-orange-100 text-orange-700'
                        : todo.priority_score >= 4
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {todo.priority_score >= 8 ? 'Critical' : 
                       todo.priority_score >= 6 ? 'High' :
                       todo.priority_score >= 4 ? 'Medium' : 'Low'} ({todo.priority_score.toFixed(1)})
                    </span>
                  )}
                </div>
                
                {/* Timer and Duration Info */}
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                  {todo.duration_minutes && (
                    <span>Est: {formatMinutes(todo.duration_minutes)}</span>
                  )}
                  {todo.actual_minutes > 0 && (
                    <span>Spent: {formatMinutes(todo.actual_minutes)}</span>
                  )}
                  {activeTimer === todo.id && (
                    <span className="text-blue-600 font-medium">
                      ⏱️ {formatTime(timerSeconds)}
                    </span>
                  )}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {!todo.completed && (
                  <>
                    {activeTimer === todo.id ? (
                      <>
                        <button
                          onClick={() => pauseTimer(todo.id)}
                          className="p-1.5 text-orange-500 hover:text-orange-700 transition-colors"
                          title="Pause timer"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => finishTask(todo.id)}
                          className="p-1.5 text-green-500 hover:text-green-700 transition-colors"
                          title="Finish task"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startTimer(todo.id)}
                        className="p-1.5 text-green-500 hover:text-green-700 transition-colors"
                        title="Start timer"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
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

export default TodoList;