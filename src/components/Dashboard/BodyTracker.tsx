import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Check, 
  X, 
  TrendingUp, 
  Target, 
  Scale, 
  Activity,
  Apple,
  Flame,
  Calendar,
  Clock,
  Edit2,
  Save,
  Trash2
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

interface WorkoutItem {
  id: string;
  name: string;
  completed: boolean;
  date: string;
}

interface CalorieEntry {
  id: string;
  type: 'in' | 'out';
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface WeightEntry {
  id: string;
  weight: number;
  bodyFat?: number;
  date: string;
}

interface FitnessGoal {
  targetWeight: number;
  currentWeight: number;
  mode: 'cutting' | 'bulking' | 'maintenance';
  lastUpdate: string;
}

const BodyTracker: React.FC = () => {
  const { showSuccess, showError, showConfirmation } = useNotifications();
  
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([
    { id: '1', name: 'Push-up 3x15', completed: true, date: '2024-01-15' },
    { id: '2', name: 'Jogging 20 menit', completed: true, date: '2024-01-15' },
    { id: '3', name: 'Plank 60 detik', completed: false, date: '2024-01-15' },
    { id: '4', name: 'Squat 3x20', completed: true, date: '2024-01-15' },
    { id: '5', name: 'Pull-up 2x8', completed: false, date: '2024-01-15' }
  ]);

  const [caloriesIn, setCaloriesIn] = useState<CalorieEntry[]>([
    { id: '1', type: 'in', category: 'Sarapan', amount: 450, description: 'Nasi gudeg + teh', date: '2024-01-15' },
    { id: '2', type: 'in', category: 'Makan Siang', amount: 650, description: 'Ayam bakar + nasi', date: '2024-01-15' },
    { id: '3', type: 'in', category: 'Snack', amount: 200, description: 'Pisang + kacang', date: '2024-01-15' }
  ]);

  const [caloriesOut, setCaloriesOut] = useState<CalorieEntry[]>([
    { id: '1', type: 'out', category: 'Workout', amount: 320, description: 'Push-up + Jogging + Squat', date: '2024-01-15' }
  ]);

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([
    { id: '1', weight: 72.5, bodyFat: 18.2, date: '2024-01-15' },
    { id: '2', weight: 72.8, bodyFat: 18.5, date: '2024-01-14' },
    { id: '3', weight: 73.1, bodyFat: 18.8, date: '2024-01-13' },
    { id: '4', weight: 73.0, bodyFat: 18.6, date: '2024-01-12' },
    { id: '5', weight: 73.3, bodyFat: 19.0, date: '2024-01-11' },
    { id: '6', weight: 73.5, bodyFat: 19.2, date: '2024-01-10' },
    { id: '7', weight: 73.8, bodyFat: 19.5, date: '2024-01-09' }
  ]);

  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>({
    targetWeight: 70.0,
    currentWeight: 72.5,
    mode: 'cutting',
    lastUpdate: '2024-01-15'
  });

  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutItem | null>(null);
  const [editingMeal, setEditingMeal] = useState<CalorieEntry | null>(null);
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);
  const [newWorkout, setNewWorkout] = useState('');
  const [newMeal, setNewMeal] = useState({ category: 'Sarapan', amount: '', description: '' });
  const [newWeight, setNewWeight] = useState({ weight: '', bodyFat: '' });

  // Calculate statistics
  const completedWorkouts = workouts.filter(w => w.completed).length;
  const totalWorkouts = workouts.length;
  const workoutProgress = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  const totalCaloriesIn = caloriesIn.reduce((sum, entry) => sum + entry.amount, 0);
  const totalCaloriesOut = caloriesOut.reduce((sum, entry) => sum + entry.amount, 0);
  const calorieBalance = totalCaloriesIn - totalCaloriesOut;

  const currentWeight = weightEntries.length > 0 ? weightEntries[0].weight : fitnessGoal.currentWeight;
  const weightChange = weightEntries.length >= 2 ? 
    Number((weightEntries[0].weight - weightEntries[6]?.weight || 0).toFixed(1)) : 0;

  const weeklyWorkouts = workouts.filter(w => w.completed).length;

  // Handle functions
  const toggleWorkout = (id: string) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    setWorkouts(workouts.map(w => 
      w.id === id ? { ...w, completed: !w.completed } : w
    ));

    if (!workout.completed) {
      showSuccess('Workout Selesai! 💪', `${workout.name} berhasil diselesaikan!`);
    }
  };

  const editWorkout = (workout: WorkoutItem) => {
    setEditingWorkout(workout);
    setNewWorkout(workout.name);
    setShowAddWorkout(true);
  };

  const updateWorkout = () => {
    if (!editingWorkout || !newWorkout.trim()) return;
    
    setWorkouts(workouts.map(workout => 
      workout.id === editingWorkout.id 
        ? { ...workout, name: newWorkout.trim() }
        : workout
    ));
    setEditingWorkout(null);
    setNewWorkout('');
    setShowAddWorkout(false);
    showSuccess('Workout Diperbarui', 'Workout berhasil diperbarui!');
  };

  const deleteWorkout = async (id: string) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    showConfirmation(
      'Hapus Workout',
      `Apakah Anda yakin ingin menghapus "${workout.name}"?`,
      () => {
        setWorkouts(workouts.filter(w => w.id !== id));
        showSuccess('Workout Dihapus', 'Workout berhasil dihapus dari daftar');
      },
      {
        confirmText: 'Hapus',
        cancelText: 'Batal',
        type: 'danger'
      }
    );
  };

  const addWorkout = () => {
    if (!newWorkout.trim()) return;
    
    const workout: WorkoutItem = {
      id: Date.now().toString(),
      name: newWorkout.trim(),
      completed: false,
      date: new Date().toISOString().split('T')[0]
    };
    
    setWorkouts([...workouts, workout]);
    setNewWorkout('');
    setShowAddWorkout(false);
    showSuccess('Workout Ditambahkan', `${workout.name} berhasil ditambahkan ke daftar!`);
  };

  const editMeal = (meal: CalorieEntry) => {
    setEditingMeal(meal);
    setNewMeal({
      category: meal.category,
      amount: meal.amount.toString(),
      description: meal.description
    });
    setShowAddMeal(true);
  };

  const updateMeal = () => {
    if (!editingMeal || !newMeal.description.trim() || !newMeal.amount) return;
    
    setCaloriesIn(caloriesIn.map(meal => 
      meal.id === editingMeal.id 
        ? { 
            ...meal, 
            category: newMeal.category,
            amount: parseInt(newMeal.amount),
            description: newMeal.description.trim()
          }
        : meal
    ));
    setEditingMeal(null);
    setNewMeal({ category: 'Sarapan', amount: '', description: '' });
    setShowAddMeal(false);
    showSuccess('Makanan Diperbarui', 'Data makanan berhasil diperbarui!');
  };

  const deleteMeal = async (id: string) => {
    const meal = caloriesIn.find(m => m.id === id);
    if (!meal) return;

    showConfirmation(
      'Hapus Makanan',
      `Apakah Anda yakin ingin menghapus "${meal.description}" dari ${meal.category}?`,
      () => {
        setCaloriesIn(caloriesIn.filter(m => m.id !== id));
        showSuccess('Makanan Dihapus', 'Data makanan berhasil dihapus');
      },
      {
        confirmText: 'Hapus',
        cancelText: 'Batal',
        type: 'danger'
      }
    );
  };

  const addMeal = () => {
    if (!newMeal.description.trim() || !newMeal.amount) return;
    
    const meal: CalorieEntry = {
      id: Date.now().toString(),
      type: 'in',
      category: newMeal.category,
      amount: parseInt(newMeal.amount),
      description: newMeal.description.trim(),
      date: new Date().toISOString().split('T')[0]
    };
    
    setCaloriesIn([...caloriesIn, meal]);
    setNewMeal({ category: 'Sarapan', amount: '', description: '' });
    setShowAddMeal(false);
    showSuccess('Makanan Ditambahkan', `${meal.description} (${meal.amount} kcal) berhasil ditambahkan!`);
  };

  const editWeight = (weight: WeightEntry) => {
    setEditingWeight(weight);
    setNewWeight({
      weight: weight.weight.toString(),
      bodyFat: weight.bodyFat?.toString() || ''
    });
    setShowAddWeight(true);
  };

  const updateWeight = () => {
    if (!editingWeight || !newWeight.weight) return;
    
    setWeightEntries(weightEntries.map(weight => 
      weight.id === editingWeight.id 
        ? { 
            ...weight, 
            weight: parseFloat(newWeight.weight),
            bodyFat: newWeight.bodyFat ? parseFloat(newWeight.bodyFat) : undefined
          }
        : weight
    ));
    setEditingWeight(null);
    setNewWeight({ weight: '', bodyFat: '' });
    setShowAddWeight(false);
    showSuccess('Data Berat Diperbarui', 'Data berat badan berhasil diperbarui!');
  };

  const deleteWeight = async (id: string) => {
    const weight = weightEntries.find(w => w.id === id);
    if (!weight) return;

    showConfirmation(
      'Hapus Data Berat',
      `Apakah Anda yakin ingin menghapus data berat ${weight.weight} kg pada ${new Date(weight.date).toLocaleDateString()}?`,
      () => {
        setWeightEntries(weightEntries.filter(w => w.id !== id));
        showSuccess('Data Berat Dihapus', 'Data berat badan berhasil dihapus');
      },
      {
        confirmText: 'Hapus',
        cancelText: 'Batal',
        type: 'danger'
      }
    );
  };

  const addWeight = () => {
    if (!newWeight.weight) return;
    
    const weight: WeightEntry = {
      id: Date.now().toString(),
      weight: parseFloat(newWeight.weight),
      bodyFat: newWeight.bodyFat ? parseFloat(newWeight.bodyFat) : undefined,
      date: new Date().toISOString().split('T')[0]
    };
    
    setWeightEntries([weight, ...weightEntries]);
    setNewWeight({ weight: '', bodyFat: '' });
    setShowAddWeight(false);
    showSuccess('Data Berat Ditambahkan', `Berat ${weight.weight} kg berhasil dicatat!`);
  };

  const updateGoal = () => {
    setFitnessGoal({
      ...fitnessGoal,
      currentWeight: currentWeight,
      lastUpdate: new Date().toISOString().split('T')[0]
    });
    setShowEditGoal(false);
    showSuccess('Goal Diperbarui', 'Target fitness Anda berhasil diperbarui!');
  };

  const cancelEdit = () => {
    setEditingWorkout(null);
    setEditingMeal(null);
    setEditingWeight(null);
    setNewWorkout('');
    setNewMeal({ category: 'Sarapan', amount: '', description: '' });
    setNewWeight({ weight: '', bodyFat: '' });
    setShowAddWorkout(false);
    setShowAddMeal(false);
    setShowAddWeight(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs">
        <span>Dashboard</span>
        <span className="breadcrumb-separator">/</span>
        <span className="text-gray-900 font-medium">Body</span>
      </nav>

      {/* 💪 1. WORKOUT CHECKLIST */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="card-title">Workout Checklist</h2>
              <p className="text-xs text-gray-500">{completedWorkouts} dari {totalWorkouts} selesai</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddWorkout(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Workout
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress Hari Ini</span>
            <span className="text-sm text-gray-600">{workoutProgress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill progress-fill-success" 
              style={{ width: `${workoutProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Workout List */}
        <div className="space-y-2">
          {workouts.map((workout, index) => (
            <div
              key={workout.id}
              className={`p-3 border rounded-xl transition-all duration-200 hover-lift ${
                workout.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={() => toggleWorkout(workout.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover-scale ${
                      workout.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {workout.completed && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`flex-1 text-sm ${workout.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {workout.name}
                  </span>
                  <span className="text-xs text-gray-500">💪</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-1 ml-3">
                  <button
                    onClick={() => editWorkout(workout)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 hover-scale"
                    title="Edit workout"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover-scale"
                    title="Delete workout"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Workout Modal */}
        {showAddWorkout && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingWorkout ? 'Edit Workout' : 'Add New Workout'}
                </h3>
                <input
                  type="text"
                  value={newWorkout}
                  onChange={(e) => setNewWorkout(e.target.value)}
                  placeholder="e.g., Push-up 3x15, Jogging 20 menit"
                  className="input mb-4"
                  autoFocus
                />
                <div className="flex space-x-3">
                  <button 
                    onClick={editingWorkout ? updateWorkout : addWorkout} 
                    className="btn-primary flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingWorkout ? 'Update' : 'Add'} Workout
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🍎 2. CALORIE TRACKER */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
              <Apple className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="card-title">Calorie Tracker</h2>
              <p className="text-xs text-gray-500">
                {calorieBalance > 0 ? `+${calorieBalance} surplus` : `${calorieBalance} defisit`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddMeal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meal
          </button>
        </div>

        {/* Calorie Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Kalori Masuk</span>
              <Apple className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-xl font-bold text-green-600">{totalCaloriesIn}</div>
            <div className="text-xs text-green-600">kcal</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-700">Kalori Keluar</span>
              <Flame className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xl font-bold text-orange-600">{totalCaloriesOut}</div>
            <div className="text-xs text-orange-600">kcal</div>
          </div>
        </div>

        {/* Calorie Balance Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Balance</span>
            <span className={`text-sm font-medium ${calorieBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {calorieBalance > 0 ? `+${calorieBalance}` : calorieBalance} kcal
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-fill ${calorieBalance > 0 ? 'progress-fill-error' : 'progress-fill-success'}`}
              style={{ width: `${Math.min(Math.abs(calorieBalance) / 10, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Recent Meals */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Makanan Hari Ini</h4>
          <div className="space-y-2">
            {caloriesIn.slice(0, 3).map((meal, index) => (
              <div key={meal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{meal.category}</span>
                  <p className="text-xs text-gray-600">{meal.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{meal.amount} kcal</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => editMeal(meal)}
                      className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-all duration-200"
                      title="Edit meal"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-200"
                      title="Delete meal"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add/Edit Meal Modal */}
        {showAddMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingMeal ? 'Edit Meal' : 'Add Meal'}
                </h3>
                <div className="space-y-3">
                  <select
                    value={newMeal.category}
                    onChange={(e) => setNewMeal({ ...newMeal, category: e.target.value })}
                    className="input"
                  >
                    <option value="Sarapan">Sarapan</option>
                    <option value="Makan Siang">Makan Siang</option>
                    <option value="Makan Malam">Makan Malam</option>
                    <option value="Snack">Snack</option>
                  </select>
                  <input
                    type="text"
                    value={newMeal.description}
                    onChange={(e) => setNewMeal({ ...newMeal, description: e.target.value })}
                    placeholder="Deskripsi makanan"
                    className="input"
                  />
                  <input
                    type="number"
                    value={newMeal.amount}
                    onChange={(e) => setNewMeal({ ...newMeal, amount: e.target.value })}
                    placeholder="Kalori (kcal)"
                    className="input"
                  />
                </div>
                <div className="flex space-x-3 mt-4">
                  <button 
                    onClick={editingMeal ? updateMeal : addMeal} 
                    className="btn-primary flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingMeal ? 'Update' : 'Add'} Meal
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ⚖️ 3. BODY PROGRESS CHART */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <h2 className="card-title">Body Progress Chart</h2>
          </div>
          <button
            onClick={() => setShowAddWeight(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Weight Entry
          </button>
        </div>

        {/* Weight Chart Simulation */}
        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Berat Badan (7 hari terakhir)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          
          {/* Simple Line Chart Representation */}
          <div className="h-32 flex items-end space-x-2">
            {weightEntries.slice(0, 7).reverse().map((entry, index) => {
              const height = ((entry.weight - 70) / 5) * 100; // Scale for visualization
              return (
                <div key={entry.id} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${Math.max(height, 10)}%` }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-1">{entry.weight}kg</span>
                  <span className="text-xs text-gray-500">{new Date(entry.date).getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weight Log */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Log 7 Hari Terakhir</h4>
          <div className="space-y-2">
            {weightEntries.slice(0, 7).map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{entry.weight} kg</span>
                  {entry.bodyFat && (
                    <span className="text-xs text-gray-600 ml-2">({entry.bodyFat}% fat)</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => editWeight(entry)}
                      className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-all duration-200"
                      title="Edit weight"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteWeight(entry.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-200"
                      title="Delete weight"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add/Edit Weight Modal */}
        {showAddWeight && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingWeight ? 'Edit Weight Entry' : 'Add Weight Entry'}
                </h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight.weight}
                    onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
                    placeholder="Berat badan (kg)"
                    className="input"
                    autoFocus
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight.bodyFat}
                    onChange={(e) => setNewWeight({ ...newWeight, bodyFat: e.target.value })}
                    placeholder="Body fat % (opsional)"
                    className="input"
                  />
                </div>
                <div className="flex space-x-3 mt-4">
                  <button 
                    onClick={editingWeight ? updateWeight : addWeight} 
                    className="btn-primary flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingWeight ? 'Update' : 'Save'} Entry
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🎯 4. FITNESS GOAL SUMMARY */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h2 className="card-title">Fitness Goal Summary</h2>
          </div>
          <button
            onClick={() => setShowEditGoal(true)}
            className="btn-secondary"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Goal
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-sm font-medium text-blue-700">Berat Target</div>
            <div className="text-xl font-bold text-blue-600">{fitnessGoal.targetWeight} kg</div>
          </div>
          <div className="p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="text-sm font-medium text-green-700">Berat Saat Ini</div>
            <div className="text-xl font-bold text-green-600">{currentWeight} kg</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
            <div className="text-sm font-medium text-purple-700">Mode</div>
            <div className="text-sm font-bold text-purple-600 capitalize">{fitnessGoal.mode}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-sm font-medium text-gray-700">Update Terakhir</div>
            <div className="text-sm font-bold text-gray-600">
              {new Date(fitnessGoal.lastUpdate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Edit Goal Modal */}
        {showEditGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Fitness Goal</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    step="0.1"
                    value={fitnessGoal.targetWeight}
                    onChange={(e) => setFitnessGoal({ ...fitnessGoal, targetWeight: parseFloat(e.target.value) || 0 })}
                    placeholder="Target weight (kg)"
                    className="input"
                  />
                  <select
                    value={fitnessGoal.mode}
                    onChange={(e) => setFitnessGoal({ ...fitnessGoal, mode: e.target.value as any })}
                    className="input"
                  >
                    <option value="cutting">Cutting (Turun berat)</option>
                    <option value="bulking">Bulking (Naik berat)</option>
                    <option value="maintenance">Maintenance (Pertahankan)</option>
                  </select>
                </div>
                <div className="flex space-x-3 mt-4">
                  <button onClick={updateGoal} className="btn-primary flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Update Goal
                  </button>
                  <button onClick={() => setShowEditGoal(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📊 STATISTICS RING */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h2 className="card-title">Weekly Statistics</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card stat-card-primary">
            <div className="stat-value">{currentWeight} kg</div>
            <div className="stat-label">Berat Terakhir</div>
          </div>
          <div className={`stat-card ${weightChange < 0 ? 'stat-card-success' : weightChange > 0 ? 'stat-card-error' : 'stat-card-warning'}`}>
            <div className="stat-value">
              {weightChange > 0 ? '+' : ''}{weightChange} kg
            </div>
            <div className="stat-label">Perubahan 7 Hari</div>
          </div>
          <div className="stat-card stat-card-success">
            <div className="stat-value">{weeklyWorkouts}</div>
            <div className="stat-label">Workout Selesai</div>
          </div>
          <div className={`stat-card ${calorieBalance > 0 ? 'stat-card-error' : 'stat-card-success'}`}>
            <div className="stat-value">
              {calorieBalance > 0 ? 'Surplus' : 'Defisit'}
            </div>
            <div className="stat-label">Status Kalori</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyTracker;