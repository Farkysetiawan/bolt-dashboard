import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Save, Edit2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

interface UserProfileProps {
  onProfileUpdate?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onProfileUpdate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        // Use upsert to handle both creation and updates
        const defaultProfile = {
          id: user?.id,
          email: user?.email || '',
          full_name: '',
          bio: '',
          avatar_url: ''
        };
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert([defaultProfile])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setEditForm({
          full_name: '',
          bio: '',
          avatar_url: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      setIsEditing(false);
      
      // Trigger header refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      
      // Also call the callback if provided
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || ''
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-2 sm:space-y-0">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
            <User className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-blue-600" />
            Profile
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 lg:space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {editForm.avatar_url ? (
                  <img
                    src={editForm.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User className={`w-6 h-6 lg:w-8 lg:h-8 text-gray-400 ${editForm.avatar_url ? 'hidden' : ''}`} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm lg:text-base"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm lg:text-base"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 lg:space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User className={`w-6 h-6 lg:w-8 lg:h-8 text-gray-400 ${profile?.avatar_url ? 'hidden' : ''}`} />
              </div>
              <div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                  {profile?.full_name || 'No name set'}
                </h3>
                <p className="text-gray-600 flex items-center mt-1 text-sm lg:text-base">
                  <Mail className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                  {profile?.email}
                </p>
                {profile?.created_at && (
                  <p className="text-xs lg:text-sm text-gray-500 flex items-center mt-1">
                    <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{profile.bio}</p>
              </div>
            )}

            {!profile?.bio && !profile?.full_name && (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Your profile is incomplete</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm lg:text-base"
                >
                  Complete your profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Statistics */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <div className="text-center p-3 lg:p-4 bg-blue-50 rounded-lg">
            <div className="text-lg lg:text-2xl font-bold text-blue-600">0</div>
            <div className="text-xs lg:text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="text-center p-3 lg:p-4 bg-green-50 rounded-lg">
            <div className="text-lg lg:text-2xl font-bold text-green-600">0</div>
            <div className="text-xs lg:text-sm text-gray-600">Completed Goals</div>
          </div>
          <div className="text-center p-3 lg:p-4 bg-purple-50 rounded-lg">
            <div className="text-lg lg:text-2xl font-bold text-purple-600">0</div>
            <div className="text-xs lg:text-sm text-gray-600">Journal Entries</div>
          </div>
          <div className="text-center p-3 lg:p-4 bg-orange-50 rounded-lg">
            <div className="text-lg lg:text-2xl font-bold text-orange-600">0</div>
            <div className="text-xs lg:text-sm text-gray-600">Quick Links</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;