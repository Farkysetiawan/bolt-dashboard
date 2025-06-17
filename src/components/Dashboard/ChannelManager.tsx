import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, X, Upload, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Channel {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  user_id: string;
}

const ChannelManager: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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
      resetForm();
    } catch (error) {
      console.error('Error adding channel:', error);
      alert('Failed to add channel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setChannels(channels.filter(channel => channel.id !== id));
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

  const isValidImageUrl = (url: string): boolean => {
    return url && (url.startsWith('http') || url.startsWith('data:image/'));
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

  return (
    <div className="space-y-6">
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
              className="card hover-lift stagger-item group"
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
                
                <button
                  onClick={() => deleteChannel(channel.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover-scale"
                  title="Delete channel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                Channel created
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fab"
        title="Add Channel"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Channel</h3>
                <button
                  onClick={resetForm}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-all duration-200 hover-scale"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Logo (Optional)
                  </label>
                  
                  <div className="flex items-center space-x-4">
                    {/* Logo Preview */}
                    <div className="w-16 h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
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
                    
                    {/* Upload Button */}
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
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Processing...' : 'Upload Logo'}
                      </button>
                      
                      {formData.logo_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo_url: '' })}
                          className="ml-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a PNG or JPG image. It will be automatically resized to 200x200px.
                  </p>
                </div>

                {/* Channel Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter channel name..."
                    className="input"
                    required
                    disabled={saving}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving || uploading || !formData.name.trim()}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Adding...' : 'Add Channel'}
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