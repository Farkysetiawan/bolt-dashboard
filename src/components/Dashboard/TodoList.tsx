import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Clock, Calendar, ChevronLeft, ChevronRight, Play, Pause, Square, Trophy, TrendingUp, BarChart3, Edit2, Zap, Star, Timer, Target } from 'lucide-react';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
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
    
    // FIXED Priority Calculation Model
    // Weighted formula: (Urgency * 0.3) + (Importance * 0.3) + (Impact * 0.3) + (Effort * 0.1)
    // This gives more weight to urgency, importance, and impact
    
    const urgencyScore = urgency * 0.3;
    const importanceScore = importance * 0.3;
    const impactScore = impact * 0.3;
    const effortScore = effort * 0.1; // Lower weight for effort
    
    const finalScore = urgencyScore + importanceScore + impactScore + effortScore;
    
    // Ensure score is between 0.1 and 10.0
    const normalizedScore = Math.min(Math.max(finalScore, 0.1), 10.0);
    
    // Round to 1 decimal place
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
      setShowAddModal(false);
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

  const updateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !newTodo.trim()) return;

    try {
      const priorityScore = calculatePriorityScore(priorityForm);
      
      const { data, error } = await supabase
        .from('todos')
        .update({
          title: newTodo.trim(),
          urgency: priorityForm.urgency,
          importance: priorityForm.importance,
          effort: priorityForm.effort,
          impact: priorityForm.impact,
          duration_minutes: priorityForm.duration_minutes,
          priority_score: priorityScore,
        })
        .eq('id', editingTodo.id)
        .select()
        .single();

      if (error) throw error;
      
      setTodos(todos.map(todo => todo.id === editingTodo.id ? data : todo));
      setNewTodo('');
      setEditingTodo(null);
      setShowAddModal(false);
      // Reset form to defaults
      setPriorityForm({
        urgency: 5,
        importance: 5,
        effort: 5,
        impact: 5,
        duration_minutes: 30
      });
    } catch (error) {
      console.error('Error updating todo:', error);
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

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setNewTodo(todo.title);
    setPriorityForm({
      urgency: todo.urgency || 5,
      importance: todo.importance || 5,
      effort: todo.effort || 5,
      impact: todo.impact || 5,
      duration_minutes: todo.duration_minutes || 30
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingTodo(null);
    setNewTodo('');
    setPriorityForm({
      urgency: 5,
      importance: 5,
      effort: 5,
      impact: 5,
      duration_minutes: 30
    });
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

  const getTaskStatus = (todo: Todo) => {
    if (todo.completed) return 'Completed';
    if (todo.is_timer_active) return 'On Progress';
    return 'Pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'On Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200';
    if (score >= 6) return 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-200';
    if (score >= 4) return 'bg-gradient-to-r from-yellow-500 to-green-500 text-white shadow-lg shadow-yellow-200';
    return 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg shadow-green-200';
  };

  const getPriorityIcon = (score: number) => {
    if (score >= 8) return <Zap className="w-3 h-3" />;
    if (score >= 6) return <Star className="w-3 h-3" />;
    if (score >= 4) return <Target className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-4 lg:p-6 border border-blue-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-5/6"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/6"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-xl p-4 lg:p-6 border border-blue-200 backdrop-blur-sm">
        {/* Header - Modern Gradient Design */}
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6">
          {/* Title and Buttons Container */}
          <div className="flex items-center justify-between lg:justify-start lg:flex-1">
            <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 mr-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              To Do List
            </h2>
            
            {/* Mobile: Animated Buttons */}
            <div className="flex items-center space-x-2 lg:hidden">
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-1">
                  <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-xs font-medium">Add</span>
                </div>
              </button>
              
              <button
                onClick={() => setShowStats(!showStats)}
                className={`group relative overflow-hidden px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out ${
                  showStats 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
                    : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200'
                }`}
              >
                <div className="relative flex items-center space-x-1">
                  <Trophy className={`w-3 h-3 transition-transform duration-300 ${showStats ? 'animate-bounce' : 'group-hover:rotate-12'}`} />
                  <span className="text-xs font-medium">Stats</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Desktop: Enhanced Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-out"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center space-x-2">
                <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-semibold">Add Task</span>
              </div>
            </button>
            
            <button
              onClick={() => setShowStats(!showStats)}
              className={`group relative overflow-hidden px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-out ${
                showStats 
                  ? 'bg-gradient-to-r from-purple-500 via-pink-600 to-red-500 text-white' 
                  : 'bg-gradient-to-r from-purple-100 via-pink-100 to-red-100 text-purple-700 hover:from-purple-200 hover:via-pink-200 hover:to-red-200'
              }`}
            >
              <div className="relative flex items-center space-x-2">
                <Trophy className={`w-4 h-4 transition-transform duration-300 ${showStats ? 'animate-pulse' : 'group-hover:rotate-12'}`} />
                <span className="font-semibold">Points & Stats</span>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Performance Dashboard */}
        {showStats && (
          <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 rounded-2xl border-2 border-purple-200 shadow-xl backdrop-blur-sm animate-fadeIn">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                <Trophy className="w-5 h-5 text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Performance Dashboard - {format(new Date(), 'MMMM yyyy')}
              </h3>
            </div>
            
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-center shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{monthlyStats.totalPoints}</div>
                <div className="text-purple-100 text-sm font-medium">Total Points</div>
                <div className="text-purple-200 text-xs">This Month</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-center shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{monthlyStats.totalCompleted}</div>
                <div className="text-blue-100 text-sm font-medium">Tasks Done</div>
                <div className="text-blue-200 text-xs">This Month</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-center shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{monthlyStats.averageScore}</div>
                <div className="text-green-100 text-sm font-medium">Avg Score</div>
                <div className="text-green-200 text-xs">Per Task</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-center shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  {monthlyStats.timeUsage > 0 ? `${monthlyStats.timeUsage}%` : 'N/A'}
                </div>
                <div className="text-orange-100 text-sm font-medium">Effort Level</div>
                <div className="text-orange-200 text-xs">Time Investment</div>
              </div>
            </div>

            {/* Enhanced Time Analysis */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                <h4 className="text-lg font-bold text-gray-900">Time Analysis</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Time Spent:</span>
                  <span className="font-bold text-blue-600">{formatMinutes(monthlyStats.totalActual)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Estimated:</span>
                  <span className="font-bold text-purple-600">{formatMinutes(monthlyStats.totalEstimated)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-50 to-red-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Effort Level:</span>
                  <span className="font-bold text-red-600">{monthlyStats.usageLabel}</span>
                </div>
              </div>
              
              {/* Enhanced Performance Insights */}
              <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100">
                <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                  Performance Insights
                </h5>
                <div className="text-xs text-gray-700 space-y-2">
                  {monthlyStats.totalCompleted === 0 && (
                    <p className="flex items-center"><Star className="w-3 h-3 mr-2 text-blue-500" />Start completing tasks to see your performance metrics</p>
                  )}
                  {monthlyStats.totalCompleted > 0 && monthlyStats.timeUsage < 50 && (
                    <p className="flex items-center"><Target className="w-3 h-3 mr-2 text-red-500" />⚠️ Low effort detected - you may be giving up too early</p>
                  )}
                  {monthlyStats.totalCompleted > 0 && monthlyStats.timeUsage >= 75 && monthlyStats.timeUsage <= 100 && (
                    <p className="flex items-center"><Trophy className="w-3 h-3 mr-2 text-green-500" />👍 Standard performance - you're meeting estimates well</p>
                  )}
                  {monthlyStats.totalCompleted > 0 && monthlyStats.timeUsage > 100 && (
                    <p className="flex items-center"><Zap className="w-3 h-3 mr-2 text-purple-500" />🌟 Excellent effort! Going beyond estimates</p>
                  )}
                  {monthlyStats.averageScore >= 8 && (
                    <p className="flex items-center"><Star className="w-3 h-3 mr-2 text-yellow-500" />High-impact task selection! Focusing on important work</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Date Navigation */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigateDate('prev')}
                className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 transform hover:scale-110"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all duration-300 border border-blue-200 shadow-sm"
              >
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">
                  {format(selectedDate, 'EEE, MMM d')}
                </span>
              </button>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 transform hover:scale-110"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {!isToday(selectedDate) && (
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium"
              >
                Today
              </button>
            )}
          </div>

          {/* Enhanced Week Calendar */}
          {showCalendar && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200 shadow-xl animate-slideDown">
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center text-sm font-bold text-gray-600 py-2">
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
                      p-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-110
                      ${isSameDay(day, selectedDate)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : isToday(day)
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-bold border-2 border-blue-300'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                      }
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Date Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isToday(selectedDate) ? '🌟 Today' : format(selectedDate, 'EEEE, MMMM d')}
            </span>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-lg">
              {todos.length} {todos.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>

        {/* Enhanced Todo List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-300">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-600 mb-2">
                No tasks for {isToday(selectedDate) ? 'today' : format(selectedDate, 'MMM d')}
              </p>
              <p className="text-gray-500">Add one above to get started! ✨</p>
            </div>
          ) : (
            todos.map((todo, index) => (
              <div
                key={todo.id}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl animate-slideIn ${
                  todo.completed
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg shadow-green-100'
                    : 'bg-gradient-to-r from-white via-blue-50 to-purple-50 border-blue-200 shadow-lg shadow-blue-100 hover:shadow-purple-200'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <button
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                        className={`flex-shrink-0 w-7 h-7 rounded-full border-3 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                          todo.completed
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-200'
                            : 'border-blue-300 hover:border-green-500 hover:bg-green-50'
                        }`}
                      >
                        {todo.completed && <Check className="w-4 h-4 animate-bounce" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg mb-3 transition-all duration-300 ${
                          todo.completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        }`}>
                          {todo.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Enhanced Estimasi Waktu */}
                          {todo.duration_minutes && (
                            <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border border-blue-200">
                              <Timer className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-700">
                                {formatMinutes(todo.duration_minutes)}
                              </span>
                            </div>
                          )}
                          
                          {/* Enhanced Progress Status */}
                          <span className={`px-4 py-2 text-sm rounded-xl font-bold border-2 transition-all duration-300 ${getStatusColor(getTaskStatus(todo))}`}>
                            {getTaskStatus(todo)}
                          </span>
                          
                          {/* Enhanced Priority Badge */}
                          {todo.priority_score && (
                            <span className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-xl font-bold border-2 transition-all duration-300 transform hover:scale-105 ${getPriorityColor(todo.priority_score)}`}>
                              {getPriorityIcon(todo.priority_score)}
                              <span>
                                {todo.priority_score >= 8 ? 'Critical' : 
                                 todo.priority_score >= 6 ? 'High' :
                                 todo.priority_score >= 4 ? 'Medium' : 'Low'} ({todo.priority_score.toFixed(1)})
                              </span>
                            </span>
                          )}
                        </div>
                        
                        {/* Enhanced Timer Display */}
                        {activeTimer === todo.id && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-white font-bold text-lg">
                                ⏱️ {formatTime(timerSeconds)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {!todo.completed && (
                        <>
                          {activeTimer === todo.id ? (
                            <>
                              <button
                                onClick={() => pauseTimer(todo.id)}
                                className="p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                                title="Pause timer"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => finishTask(todo.id)}
                                className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                                title="Finish task"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startTimer(todo.id)}
                              className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                              title="Start timer"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => openEditModal(todo)}
                        className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                        title="Edit task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl hover:from-red-500 hover:to-red-600 hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Enhanced Add/Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2 border-blue-200 animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingTodo ? '✏️ Edit Task' : '✨ Add New Task'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={editingTodo ? updateTodo : addTodo} className="space-y-6">
                {/* Enhanced Task Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📝 Task Name
                  </label>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Enter your awesome task..."
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>

                {/* Enhanced Priority & Duration Section */}
                <div className="space-y-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-purple-600" />
                    Set Task Priority & Duration
                  </h4>
                  
                  {/* Enhanced Sliders */}
                  {[
                    { key: 'urgency', label: '🔥 Urgency (Deadline Pressure)', color: 'red' },
                    { key: 'importance', label: '⭐ Importance (Strategic Value)', color: 'blue' },
                    { key: 'effort', label: '💪 Effort Required', color: 'yellow' },
                    { key: 'impact', label: '🎯 Impact (Results)', color: 'green' }
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        {label}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={priorityForm[key as keyof PriorityForm]}
                        onChange={(e) => setPriorityForm({...priorityForm, [key]: parseInt(e.target.value)})}
                        className={`w-full h-3 bg-${color}-200 rounded-lg appearance-none cursor-pointer slider-${color}`}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Low</span>
                        <span className={`font-bold text-${color}-600 text-lg`}>
                          {priorityForm[key as keyof PriorityForm]}
                        </span>
                        <span>High</span>
                      </div>
                    </div>
                  ))}

                  {/* Enhanced Duration */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      ⏰ Estimated Duration
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="480"
                      step="5"
                      value={priorityForm.duration_minutes}
                      onChange={(e) => setPriorityForm({...priorityForm, duration_minutes: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>5m</span>
                      <span className="font-bold text-gray-600 text-lg">
                        {formatMinutes(priorityForm.duration_minutes)}
                      </span>
                      <span>8h</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Priority Score Display */}
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl border-2 border-purple-300 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Priority Score:
                    </span>
                    <span className="text-3xl font-bold text-white animate-pulse">
                      {calculatePriorityScore(priorityForm).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold text-lg transform hover:scale-105"
                  >
                    {editingTodo ? '✅ Update Task' : '🚀 Add Task'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-4 text-gray-600 border-2 border-gray-300 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-bold transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .slider-red::-webkit-slider-thumb {
          background: linear-gradient(45deg, #ef4444, #dc2626);
        }
        
        .slider-blue::-webkit-slider-thumb {
          background: linear-gradient(45deg, #3b82f6, #2563eb);
        }
        
        .slider-yellow::-webkit-slider-thumb {
          background: linear-gradient(45deg, #eab308, #ca8a04);
        }
        
        .slider-green::-webkit-slider-thumb {
          background: linear-gradient(45deg, #22c55e, #16a34a);
        }
      `}</style>
    </>
  );
};

export default TodoList;