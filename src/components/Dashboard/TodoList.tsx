import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Clock, Calendar, ChevronLeft, ChevronRight, Play, Pause, Square, BarChart3, Edit2 } from 'lucide-react';
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
    const urgencyScore = urgency * 0.3;
    const importanceScore = importance * 0.3;
    const impactScore = impact * 0.3;
    const effortScore = effort * 0.1;
    const finalScore = urgencyScore + importanceScore + impactScore + effortScore;
    const normalizedScore = Math.min(Math.max(finalScore, 0.1), 10.0);
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
      return minutes % 1 === 0 ? `${minutes}m` : `${minutes.toFixed(1)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round((minutes % 60) * 10) / 10;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const generateWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
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
      const totalPoints = completedTodos.reduce((sum, todo) => {
        let basePoints = todo.priority_score || 0;
        if (todo.duration_minutes && todo.actual_minutes !== null) {
          const timeUsageRatio = todo.actual_minutes / todo.duration_minutes;
          if (timeUsageRatio <= 0.8) {
            basePoints *= 1.3;
          } else if (timeUsageRatio <= 1.0) {
            basePoints *= 1.1;
          } else if (timeUsageRatio <= 1.5) {
            basePoints *= 1.0;
          } else if (timeUsageRatio <= 2.0) {
            basePoints *= 0.9;
          } else {
            basePoints *= 0.7;
          }
        }
        return sum + basePoints;
      }, 0);

      const totalCompleted = completedTodos.length;
      const averageScore = totalCompleted > 0 ? totalPoints / totalCompleted : 0;
      const totalEstimated = completedTodos.reduce((sum, todo) => sum + (todo.duration_minutes || 0), 0);
      const totalActual = completedTodos.reduce((sum, todo) => sum + (todo.actual_minutes || 0), 0);
      
      let timeUsage = 0;
      let usageLabel = 'No data';
      
      if (totalEstimated > 0 && totalActual >= 0) {
        timeUsage = (totalActual / totalEstimated) * 100;
        if (timeUsage < 50) {
          usageLabel = 'Poor Effort';
        } else if (timeUsage >= 50 && timeUsage < 75) {
          usageLabel = 'Below Standard';
        } else if (timeUsage >= 75 && timeUsage <= 100) {
          usageLabel = 'Standard';
        } else if (timeUsage > 100 && timeUsage <= 150) {
          usageLabel = 'Excellent';
        } else if (timeUsage > 150) {
          usageLabel = 'Outstanding';
        }
      } else if (totalEstimated === 0) {
        usageLabel = 'No estimates';
      }

      return {
        totalPoints: Math.round(totalPoints * 10) / 10,
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
    if (todo.is_timer_active) return 'In Progress';
    return 'Pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return 'badge badge-success';
      case 'In Progress': return 'badge badge-info';
      case 'Pending': return 'badge badge-gray';
      default: return 'badge badge-gray';
    }
  };

  const getPriorityBadge = (score: number) => {
    if (score >= 8) return 'badge bg-red-100 text-red-800';
    if (score >= 6) return 'badge bg-orange-100 text-orange-800';
    if (score >= 4) return 'badge bg-yellow-100 text-yellow-800';
    return 'badge bg-green-100 text-green-800';
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="card animate-fadeIn">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card animate-fadeIn">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <h2 className="card-title">Today's Tasks</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className={showStats ? 'btn-primary' : 'btn-secondary'}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Stats
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Performance - {format(new Date(), 'MMMM yyyy')}
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalPoints}</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{monthlyStats.totalCompleted}</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{monthlyStats.averageScore}</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Avg Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {monthlyStats.timeUsage > 0 ? `${monthlyStats.timeUsage}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Effort Level</div>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Time Spent:</span>
                  <span className="font-medium">{formatMinutes(monthlyStats.totalActual)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Estimated:</span>
                  <span className="font-medium">{formatMinutes(monthlyStats.totalEstimated)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Effort Level:</span>
                  <span className="font-medium">{monthlyStats.usageLabel}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="btn-ghost p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {format(selectedDate, 'EEE, MMM d')}
                </span>
              </button>
              
              <button
                onClick={() => navigateDate('next')}
                className="btn-ghost p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {!isToday(selectedDate) && (
              <button
                onClick={goToToday}
                className="btn-secondary text-sm"
              >
                Today
              </button>
            )}
          </div>

          {/* Week Calendar */}
          {showCalendar && (
            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-slate-400 py-2">
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
                    className={`p-2 text-sm rounded-lg transition-colors ${
                      isSameDay(day, selectedDate)
                        ? 'bg-blue-500 text-white'
                        : isToday(day)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Info */}
        <div className="mb-6 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-slate-100">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
            </span>
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {todos.length} {todos.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
              <p className="text-lg font-medium mb-2">
                No tasks for {isToday(selectedDate) ? 'today' : format(selectedDate, 'MMM d')}
              </p>
              <p className="text-sm">Add one above to get started!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`p-4 rounded-lg border transition-colors ${
                  todo.completed
                    ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-slate-600 hover:border-green-500'
                      }`}
                    >
                      {todo.completed && <Check className="w-3 h-3" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium mb-2 ${
                        todo.completed
                          ? 'text-gray-500 dark:text-slate-400 line-through'
                          : 'text-gray-900 dark:text-slate-100'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {todo.duration_minutes && (
                          <span className="text-sm text-gray-600 dark:text-slate-400">
                            Est: {formatMinutes(todo.duration_minutes)}
                          </span>
                        )}
                        
                        <span className={getStatusBadge(getTaskStatus(todo))}>
                          {getTaskStatus(todo)}
                        </span>
                        
                        {todo.priority_score && (
                          <span className={getPriorityBadge(todo.priority_score)}>
                            {getPriorityLabel(todo.priority_score)} ({todo.priority_score.toFixed(1)})
                          </span>
                        )}
                      </div>
                      
                      {activeTimer === todo.id && (
                        <div className="mt-2 text-blue-600 dark:text-blue-400 font-medium">
                          ⏱️ {formatTime(timerSeconds)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {!todo.completed && (
                      <>
                        {activeTimer === todo.id ? (
                          <>
                            <button
                              onClick={() => pauseTimer(todo.id)}
                              className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                              title="Pause timer"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => finishTask(todo.id)}
                              className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Finish task"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startTimer(todo.id)}
                            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Start timer"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => openEditModal(todo)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {editingTodo ? 'Edit Task' : 'Add New Task'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingTodo ? updateTodo : addTodo} className="space-y-4">
                {/* Task Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Enter task name..."
                    className="input"
                    required
                  />
                </div>

                {/* Priority Settings */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <h4 className="font-medium text-gray-900 dark:text-slate-100">Priority & Duration</h4>
                  
                  {[
                    { key: 'urgency', label: 'Urgency' },
                    { key: 'importance', label: 'Importance' },
                    { key: 'effort', label: 'Effort' },
                    { key: 'impact', label: 'Impact' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        {label}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={priorityForm[key as keyof PriorityForm]}
                        onChange={(e) => setPriorityForm({...priorityForm, [key]: parseInt(e.target.value)})}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
                        <span>Low</span>
                        <span className="font-medium">{priorityForm[key as keyof PriorityForm]}</span>
                        <span>High</span>
                      </div>
                    </div>
                  ))}

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Estimated Duration
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="480"
                      step="5"
                      value={priorityForm.duration_minutes}
                      onChange={(e) => setPriorityForm({...priorityForm, duration_minutes: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
                      <span>5m</span>
                      <span className="font-medium">{formatMinutes(priorityForm.duration_minutes)}</span>
                      <span>8h</span>
                    </div>
                  </div>
                </div>

                {/* Priority Score */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Priority Score:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {calculatePriorityScore(priorityForm).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingTodo ? 'Update Task' : 'Add Task'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TodoList;