import React, { useState, useEffect } from 'react';
import { Link, Plus, ExternalLink, Edit2, X, Globe, Github, Youtube, Twitter, Instagram, Facebook, Linkedin, Mail, Phone, Calendar, Settings, Home, Search, Heart, Star, Bookmark, Camera, Music, Video, File, Folder, Download, Upload, Share, Lock, Unlock, Eye, EyeOff, Bell, MessageCircle, Users, User, ShoppingCart, CreditCard, Truck, Package, MapPin, Clock, Zap, Wifi, Battery, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Monitor, Smartphone, Tablet, Laptop, Headphones, Mic, Speaker, Printer, Keyboard, Mouse, HardDrive, Cpu, MemoryStick, Database, Server, Cloud, Code, Terminal, Bug, Wrench, Hammer, Scissors, Paperclip, Pin, Flag, Tag, Filter, SortAsc as Sort, Grid, List, BarChart, PieChart, TrendingUp, TrendingDown, Activity, Target, Award, Trophy, Medal, Gift, Coffee, Pizza, Gamepad2, Palette, Brush, Pen, Pencil, Eraser, Ruler, Compass, Calculator, Book, BookOpen, GraduationCap } from 'lucide-react';
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

const QuickLinksHorizontal: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
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
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching quick links:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return ExternalLink;
    return presetIcons[iconName as keyof typeof presetIcons] || ExternalLink;
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="flex space-x-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
          <Link className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No quick links yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const IconComponent = getIconComponent(link.icon);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center p-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-150 min-w-[60px]"
            title={link.title || getDomainFromUrl(link.url)}
          >
            <div className="w-8 h-8 flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors duration-150">
              <IconComponent className="w-5 h-5" />
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-900 mt-1 text-center truncate max-w-[50px]">
              {link.title || getDomainFromUrl(link.url)}
            </span>
          </a>
        );
      })}
    </div>
  );
};

export default QuickLinksHorizontal;