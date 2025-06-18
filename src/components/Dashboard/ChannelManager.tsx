import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, X, Upload, Image, Settings, Edit2, Trash2, ArrowLeft, BookOpen, Video, Headphones, FileText, Link, Calendar, Clock, Star, Tag, Eye, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import AddContentForm from './AddContentForm';

interface Channel {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  user_id: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'article' | 'book' | 'podcast' | 'course' | 'tutorial' | 'documentary' | 'webinar';
  status: 'planned' | 'watching' | 'completed';
  progress: number;
  user_id: string;
  channel_id?: string;
  created_at: string;
  url?: string;
  duration?: number;
  rating?: number;
  notes?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
}

interface ContentFormData {
  title: string;
  contentType: 'Video' | 'Artikel' | 'Thread';
  totalScene: number;
  description: string;
  scenes: Array<{
    title: string;
    type: 'Visual' | 'Dialog' | 'Narasi' | 'Transisi';
    voiceOver?: string;
  }>;
  useVoiceOver: boolean;
}

const ChannelManager: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelContent, setChannelContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showContentForm, setShowContentForm] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelContent();
    }
  }, [selectedChannel]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelContent = async () => {
    if (!selectedChannel) return;
    
    setContentLoading(true);
    try {
      // First, try to get content with channel_id
      let { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', user?.id)
        .eq('channel_id', selectedChannel.id)
        .order('created_at', { ascending: false });

      // If no content found or channel_id doesn't exist, get all user content
      if (!data || data.length === 0) {
        const { data: allContent, error: allError } = await supabase
          .from('content_items')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
        
        if (allError) throw allError;
        data = allContent || [];
      }

      if (error) throw error;
      setChannelContent(data || []);
    } catch (error) {
      console.error('Error fetching channel content:', error);
      setChannelContent([]);
    } finally {
      setContentLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        // Create canvas to resize image to 200x200
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 200;
        canvas.height = 200;
        
        if (ctx) {
          // Draw image scaled to fit 200x200 while maintaining aspect ratio
          const scale = Math.min(200 / img.width, 200 / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (200 - scaledWidth) / 2;
          const y = (200 - scaledHeight) / 2;
          
          // Fill background with white
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 200, 200);
          
          // Draw the image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Convert to base64
          const resizedDataUrl = canvas.toDataURL('image/png', 0.9);
          setFormData({ ...formData, logo_url: resizedDataUrl });
        }
        setUploading(false);
      };
      
      img.onerror = () => {
        alert('Invalid image file');
        setUploading(false);
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      alert('Failed to read file');
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (selectedChannel && showAddModal) {
        // Update existing channel
        const { data, error } = await supabase
          .from('channels')
          .update({
            name: formData.name.trim(),
            logo_url: formData.logo_url || null
          })
          .eq('id', selectedChannel.id)
          .select()
          .single();

        if (error) throw error;
        
        setChannels(channels.map(channel => 
          channel.id === selectedChannel.id ? data : channel
        ));
        setSelectedChannel(data);
      } else {
        // Add new channel
        const { data, error } = await supabase
          .from('channels')
          .insert([
            {
              name: formData.name.trim(),
              logo_url: formData.logo_url || null,
              user_id: user?.id
            }
          ])
          .select()
          .single();

        if (error) throw error;
        
        setChannels([data, ...channels]);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving channel:', error);
      alert('Failed to save channel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleContentFormSubmit = async (contentData: ContentFormData) => {
    if (!selectedChannel || !user?.id) {
      console.error('Missing required data:', { selectedChannel, userId: user?.id });
      alert('Missing required data. Please try again.');
      return;
    }

    setSaving(true);
    try {
      console.log('Submitting content data:', contentData);

      // Map content type to database enum values
      const typeMapping: { [key: string]: ContentItem['type'] } = {
        'Video': 'video',
        'Artikel': 'article', 
        'Thread': 'article' // Thread mapped to article for now
      };

      const mappedType = typeMapping[contentData.contentType] || 'article';

      // Prepare content item data
      const contentItem = {
        title: contentData.title.trim(),
        type: mappedType,
        status: 'planned' as ContentItem['status'],
        progress: 0,
        user_id: user.id,
        channel_id: selectedChannel.id,
        // Store additional data in notes field as JSON string
        notes: JSON.stringify({
          description: contentData.description,
          totalScene: contentData.totalScene,
          scenes: contentData.scenes,
          useVoiceOver: contentData.useVoiceOver,
          contentType: contentData.contentType // Keep original type for reference
        })
      };

      console.log('Inserting content item:', contentItem);

      const { data, error } = await supabase
        .from('content_items')
        .insert([contentItem])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Content saved successfully:', data);
      
      // Update local state
      setChannelContent([data, ...channelContent]);
      setShowContentForm(false);
      
      alert('Content added successfully!');
    } catch (error) {
      console.error('Error adding content:', error);
      
      // More specific error messages
      if (error.message?.includes('violates check constraint')) {
        alert('Invalid content type. Please check your selection and try again.');
      } else if (error.message?.includes('violates foreign key constraint')) {
        alert('Channel not found. Please refresh and try again.');
      } else {
        alert(`Failed to add content: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateContentStatus = async (id: string, status: ContentItem['status']) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      setChannelContent(channelContent.map(item => 
        item.id === id ? { ...item, status } : item
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setChannelContent(channelContent.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    }
  };

  const deleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel? This will not delete the content items.')) return;

    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setChannels(channels.filter(channel => channel.id !== id));
      setSelectedChannel(null);
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Failed to delete channel. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', logo_url: '' });
    setShowAddModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditModal = (channel: Channel) => {
    setFormData({
      name: channel.name,
      logo_url: channel.logo_url || ''
    });
    setShowAddModal(true);
  };

  const openAddContentForm = () => {
    setShowContentForm(true);
  };

  const closeContentForm = () => {
    setShowContentForm(false);
  };

  const isValidImageUrl = (url: string): boolean => {
    return url && (url.startsWith('http') || url.startsWith('data:image/'));
  };

  const getStatusBadge = (status: ContentItem['status']) => {
    switch (status) {
      case 'completed': return 'badge badge-success';
      case 'watching': return 'badge badge-warning';
      case 'planned': return 'badge badge-gray';
      default: return 'badge badge-gray';
    }
  };

  const getStatusLabel = (status: ContentItem['status']) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'watching': return 'In Progress';
      case 'planned': return 'Planned';
      default: return 'Planned';
    }
  };

  const parseContentNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes);
    } catch {
      return null;
    }
  };

  const getChannelStats = () => {
    const total = channelContent.length;
    const completed = channelContent.filter(item => item.status === 'completed').length;
    const watching = channelContent.filter(item => item.status === 'watching').length;
    const planned = channelContent.filter(item => item.status === 'planned').length;
    
    return { total, completed, watching, planned };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show Content Form
  if (showContentForm && selectedChannel) {
    return (
      <div className="space-y-6">
        <AddContentForm
          onSubmit={handleContentFormSubmit}
          onCancel={closeContentForm}
          loading={saving}
        />
      </div>
    );
  }

  // If a channel is selected, show channel management
  if (selectedChannel && !showAddModal) {
    const stats = getChannelStats();
    
    return (
      <div className="space-y-6">
        {/* Channel Management Header */}
        <div className="card animate-fadeIn">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedChannel(null)}
                className="btn-icon-secondary"
                title="Back to channels"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {selectedChannel.logo_url && isValidImageUrl(selectedChannel.logo_url) ? (
                  <img
                    src={selectedChannel.logo_url}
                    alt={selectedChannel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Play className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <h2 className="card-title">{selectedChannel.name} Management</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openEditModal(selectedChannel)}
                className="btn-secondary"
              >
                <Edit2 className="w-3 h-3 mr-1.5" />
                Edit Channel
              </button>
              <button
                onClick={() => deleteChannel(selectedChannel.id)}
                className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Channel Content Section */}
        <div className="card animate-fadeIn">
          <div className="card-header">
            <h3 className="card-title">Channel Content</h3>
            <button 
              onClick={openAddContentForm}
              className="btn-primary"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add Content
            </button>
          </div>
          
          {contentLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : channelContent.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Play className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm mb-2">No content added yet</p>
              <button
                onClick={openAddContentForm}
                className="text-blue-600 hover:text-blue-700 text-xs"
              >
                Add your first content
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {channelContent.map((item, index) => {
                const contentData = parseContentNotes(item.notes);
                const sceneCount = contentData?.totalScene || 0;
                const hasVoiceOver = contentData?.useVoiceOver || false;
                
                return (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 hover-lift stagger-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h4 className="font-semibold text-gray-900 text-sm mb-2 truncate">
                          {item.title}
                        </h4>
                        
                        {/* Scene count and Voice Over indicator */}
                        <div className="flex items-center space-x-3 mb-3">
                          {sceneCount > 0 && (
                            <span className="text-xs text-gray-600">
                              {sceneCount} scene{sceneCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {hasVoiceOver && (
                            <span className="text-xs text-green-600 flex items-center">
                              ✅ Voice Over
                            </span>
                          )}
                        </div>
                        
                        {/* Status Dropdown */}
                        <div className="mb-3">
                          <select
                            value={item.status}
                            onChange={(e) => updateContentStatus(item.id, e.target.value as ContentItem['status'])}
                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="planned">Planned</option>
                            <option value="watching">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                        <button
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="Edit content"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteContent(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete content"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Channel Statistics */}
        <div className="card animate-fadeIn">
          <div className="card-header">
            <h3 className="card-title">Channel Statistics</h3>
          </div>
          <div className="grid-4">
            <div className="stat-card">
              <div className="stat-value text-blue-600">{stats.total}</div>
              <div className="stat-label">Total Content</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-green-600">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-orange-600">{stats.watching}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-gray-600">{stats.planned}</div>
              <div className="stat-label">Planned</div>
            </div>
          </div>
        </div>

        {/* Channel Settings */}
        <div className="card animate-fadeIn">
          <div className="card-header">
            <h3 className="card-title">Channel Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Channel Information</h4>
              <div className="grid-2">
                <div>
                  <label className="text-sm text-gray-600">Channel Name</label>
                  <p className="font-medium text-gray-900">{selectedChannel.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Created</label>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedChannel.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Channels Grid */}
      {channels.length === 0 ? (
        <div className="text-center py-16 animate-fadeIn">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No channels yet</h3>
          <p className="text-gray-600 mb-6">Click the + button to add your first content channel</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel, index) => (
            <div
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className="card hover-lift stagger-item group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {channel.logo_url && isValidImageUrl(channel.logo_url) ? (
                      <img
                        src={channel.logo_url}
                        alt={channel.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Play className={`w-6 h-6 text-gray-400 ${channel.logo_url && isValidImageUrl(channel.logo_url) ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                      {channel.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(channel.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <Settings className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              
              <div className="text-xs text-gray-500">
                Click to manage channel
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 hover-lift"
        title="Add Channel"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedChannel ? 'Edit Channel' : 'Add New Channel'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-all duration-200 hover-scale"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Channel Logo (Optional)
                  </label>
                  
                  <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-16 h-16 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {formData.logo_url && isValidImageUrl(formData.logo_url) ? (
                        <img
                          src={formData.logo_url}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploading ? 'Processing...' : 'Upload Logo'}</span>
                      </button>
                      
                      {formData.logo_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo_url: '' })}
                          className="mt-2 w-full text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Upload a PNG or JPG image. It will be automatically resized to 200x200px.
                  </p>
                </div>

                {/* Channel Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Programming Courses, Design Tutorials, Business Books"
                    className="input"
                    required
                    disabled={saving}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving || uploading || !formData.name.trim()}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : selectedChannel ? 'Update Channel' : 'Add Channel'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelManager;