import React, { useState, useEffect } from 'react';
import { Link, Plus, ExternalLink, Edit2, X, Globe, Github, Youtube, Twitter, Instagram, Facebook, Linkedin, Mail, Phone, Calendar, Settings, Home, Search, Heart, Star, Bookmark, Camera, Music, Video, File, Folder, Download, Upload, Share, Lock, Unlock, Eye, EyeOff, Bell, MessageCircle, Users, User, ShoppingCart, CreditCard, Truck, Package, MapPin, Clock, Zap, Wifi, Battery, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Monitor, Smartphone, Tablet, Laptop, Headphones, Mic, Speaker, Printer, Keyboard, Mouse, HardDrive, Cpu, MemoryStick, Database, Server, Cloud, Code, Terminal, Bug, Wrench, Hammer, Scissors, Paperclip, Pin, Flag, Tag, Filter, Sort, Grid, List, BarChart, PieChart, TrendingUp, TrendingDown, Activity, Target, Award, Trophy, Medal, Gift, Coffee, Pizza, Gamepad2, Palette, Brush, Pen, Pencil, Eraser, Ruler, Compass, Calculator, Book, BookOpen, GraduationCap, ChevronUp, ChevronDown, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  user_id: string;
  order_index?: number;
}

// Preset icons mapping
const presetIcons = {
  globe: Globe,
  github: Github,
  youtube: Youtube,
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  settings: Settings,
  home: Home,
  search: Search,
  heart: Heart,
  star: Star,
  bookmark: Bookmark,
  camera: Camera,
  music: Music,
  video: Video,
  file: File,
  folder: Folder,
  download: Download,
  upload: Upload,
  share: Share,
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  'eye-off': EyeOff,
  bell: Bell,
  'message-circle': MessageCircle,
  users: Users,
  user: User,
  'shopping-cart': ShoppingCart,
  'credit-card': CreditCard,
  truck: Truck,
  package: Package,
  'map-pin': MapPin,
  clock: Clock,
  zap: Zap,
  wifi: Wifi,
  battery: Battery,
  'volume-2': Volume2,
  'volume-x': VolumeX,
  play: Play,
  pause: Pause,
  'skip-back': SkipBack,
  'skip-forward': SkipForward,
  repeat: Repeat,
  shuffle: Shuffle,
  monitor: Monitor,
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  headphones: Headphones,
  mic: Mic,
  speaker: Speaker,
  printer: Printer,
  keyboard: Keyboard,
  mouse: Mouse,
  'hard-drive': HardDrive,
  cpu: Cpu,
  'memory-stick': MemoryStick,
  database: Database,
  server: Server,
  cloud: Cloud,
  code: Code,
  terminal: Terminal,
  bug: Bug,
  wrench: Wrench,
  hammer: Hammer,
  scissors: Scissors,
  paperclip: Paperclip,
  pin: Pin,
  flag: Flag,
  tag: Tag,
  filter: Filter,
  sort: Sort,
  grid: Grid,
  list: List,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  activity: Activity,
  target: Target,
  award: Award,
  trophy: Trophy,
  medal: Medal,
  gift: Gift,
  coffee: Coffee,
  pizza: Pizza,
  'gamepad-2': Gamepad2,
  palette: Palette,
  brush: Brush,
  pen: Pen,
  pencil: Pencil,
  eraser: Eraser,
  ruler: Ruler,
  compass: Compass,
  calculator: Calculator,
  book: Book,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap
};

const QuickLinksManager: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: 'globe'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_links')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching quick links:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!formData.url.match(/^https?:\/\/.+/)) {
      newErrors.url = 'URL must start with http:// or https://';
    }

    if (!editingLink && links.length >= 10) {
      newErrors.general = 'Maximum 10 links allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingLink) {
        // Update existing link
        const { data, error } = await supabase
          .from('quick_links')
          .update({
            title: formData.title.trim(),
            url: formData.url.trim(),
            icon: formData.icon
          })
          .eq('id', editingLink.id)
          .select()
          .single();

        if (error) throw error;
        setLinks(links.map(link => link.id === editingLink.id ? data : link));
      } else {
        // Add new link
        const { data, error } = await supabase
          .from('quick_links')
          .insert([
            {
              title: formData.title.trim(),
              url: formData.url.trim(),
              icon: formData.icon,
              user_id: user?.id
            }
          ])
          .select()
          .single();

        if (error) throw error;
        setLinks([...links, data]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving link:', error);
      setErrors({ general: 'Failed to save link. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (link: QuickLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon || 'globe'
    });
    setShowAddForm(true);
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const { error } = await supabase
        .from('quick_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLinks(links.filter(link => link.id !== id));
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const moveLink = async (index: number, direction: 'up' | 'down') => {
    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;

    // Swap positions
    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
    setLinks(newLinks);

    // Update order in database (simplified - using created_at for now)
    // In a real implementation, you'd want an order_index column
  };

  const resetForm = () => {
    setFormData({ title: '', url: '', icon: 'globe' });
    setEditingLink(null);
    setShowAddForm(false);
    setErrors({});
  };

  const getIconComponent = (iconName: string) => {
    return presetIcons[iconName as keyof typeof presetIcons] || Globe;
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const popularIcons = [
    'globe', 'github', 'youtube', 'twitter', 'instagram', 'facebook', 'linkedin',
    'mail', 'calendar', 'settings', 'home', 'search', 'heart', 'star', 'bookmark',
    'camera', 'music', 'video', 'file', 'folder', 'download', 'upload', 'share',
    'clock', 'zap', 'wifi', 'monitor', 'smartphone', 'laptop', 'code', 'terminal',
    'database', 'server', 'cloud', 'book', 'graduation-cap', 'coffee', 'pizza'
  ];

  if (loading) {
    return (
      <div className="card animate-fadeIn">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card animate-fadeIn">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Link className="w-4 h-4 text-white" />
            </div>
            <h2 className="card-title">Quick Links Manager</h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={links.length >= 10}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Link ({links.length}/10)
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-4">
              {editingLink ? 'Edit Link' : 'Add New Link'}
            </h3>
            
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-8 gap-2 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-md max-h-32 overflow-y-auto">
                  {popularIcons.map((iconName) => {
                    const IconComponent = getIconComponent(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-2 rounded-md transition-colors ${
                          formData.icon === iconName
                            ? 'bg-blue-100 text-blue-600 border-2 border-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700 border-2 border-transparent'
                        }`}
                        title={iconName}
                      >
                        <IconComponent className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter link title..."
                  className={`input ${errors.title ? 'border-red-300 focus:ring-red-500' : ''}`}
                />
                {errors.title && (
                  <p className="text-red-600 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className={`input ${errors.url ? 'border-red-300 focus:ring-red-500' : ''}`}
                />
                {errors.url && (
                  <p className="text-red-600 text-xs mt-1">{errors.url}</p>
                )}
              </div>

              {/* Preview */}
              {formData.title && formData.url && (
                <div className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-md">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Preview:</p>
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-slate-800 rounded-md">
                    <div className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-slate-400">
                      {React.createElement(getIconComponent(formData.icon), { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{formData.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{getDomainFromUrl(formData.url)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : editingLink ? 'Update Link' : 'Add Link'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Links List */}
        <div className="space-y-3">
          {links.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              <Link className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
              <p>No quick links yet. Add some above!</p>
            </div>
          ) : (
            links.map((link, index) => {
              const IconComponent = getIconComponent(link.icon || 'globe');
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <IconComponent className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-slate-100 truncate">
                        {link.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                        {getDomainFromUrl(link.url)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Reorder buttons */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveLink(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveLink(index, 'down')}
                        disabled={index === links.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Visit link */}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Visit link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(link)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit link"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickLinksManager;