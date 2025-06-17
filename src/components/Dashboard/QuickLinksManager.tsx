import React, { useState, useEffect, useRef } from 'react';
import { Link, Plus, ExternalLink, Edit2, X, ChevronUp, ChevronDown, Save, AlertCircle, Upload, Image } from 'lucide-react';
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

const QuickLinksManager: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, icon: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, icon: 'Image must be smaller than 5MB' });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        // Create canvas to resize image to 500x500
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 500;
        canvas.height = 500;
        
        if (ctx) {
          // Draw image scaled to fit 500x500 while maintaining aspect ratio
          const scale = Math.min(500 / img.width, 500 / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (500 - scaledWidth) / 2;
          const y = (500 - scaledHeight) / 2;
          
          // Fill background with white
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 500, 500);
          
          // Draw the image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Convert to base64
          const resizedDataUrl = canvas.toDataURL('image/png', 0.9);
          setFormData({ ...formData, icon: resizedDataUrl });
          setErrors({ ...errors, icon: '' });
        }
        setUploading(false);
      };
      
      img.onerror = () => {
        setErrors({ ...errors, icon: 'Invalid image file' });
        setUploading(false);
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      setErrors({ ...errors, icon: 'Failed to read file' });
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
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
            icon: formData.icon || null
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
              icon: formData.icon || null,
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
      icon: link.icon || ''
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
  };

  const resetForm = () => {
    setFormData({ title: '', url: '', icon: '' });
    setEditingLink(null);
    setShowAddForm(false);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    return url && (url.startsWith('http') || url.startsWith('data:image/'));
  };

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
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Logo (PNG, 500x500px recommended)
                </label>
                
                <div className="flex items-center space-x-4">
                  {/* Current logo preview */}
                  <div className="w-16 h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {formData.icon && isValidImageUrl(formData.icon) ? (
                      <img
                        src={formData.icon}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Upload button */}
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
                    
                    {formData.icon && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: '' })}
                        className="ml-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                {errors.icon && (
                  <p className="text-red-600 text-xs mt-1">{errors.icon}</p>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Upload a PNG image. It will be automatically resized to 500x500px.
                </p>
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
                    <div className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-slate-400 bg-white rounded overflow-hidden">
                      {formData.icon && isValidImageUrl(formData.icon) ? (
                        <img
                          src={formData.icon}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ExternalLink className="w-5 h-5" />
                      )}
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
                  disabled={saving || uploading}
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
              const hasCustomLogo = isValidImageUrl(link.icon || '');
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-lg overflow-hidden">
                      {hasCustomLogo ? (
                        <img
                          src={link.icon}
                          alt={link.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <ExternalLink className={`w-5 h-5 text-gray-600 dark:text-slate-400 ${hasCustomLogo ? 'hidden' : ''}`} />
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