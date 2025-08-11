'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { getPrivacyLevelDescription, getPrivacyLevelIcon } from '@/lib/privacy';

interface PrivacySettingsProps {
  workspaceId: Id<"workspaces">;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ workspaceId }) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [password, setPassword] = useState('');
  const [allowSearchEngines, setAllowSearchEngines] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSecretLink, setShowSecretLink] = useState(false);

  // Get current privacy settings
  const privacySettings = useQuery(api.workspaces.getWorkspacePrivacySettings, { workspaceId });
  const updatePrivacy = useMutation(api.workspaces.updateWorkspacePrivacy);

  // Initialize state when data loads
  React.useEffect(() => {
    if (privacySettings) {
      setSelectedLevel(privacySettings.level);
      setAllowSearchEngines(privacySettings.allowSearchEngines);
    }
  }, [privacySettings]);

  const handleUpdatePrivacy = async () => {
    if (!selectedLevel) return;

    setIsUpdating(true);
    try {
      const result = await updatePrivacy({
        workspaceId,
        privacyLevel: selectedLevel,
        password: selectedLevel === 'password' ? password || undefined : undefined,
        allowSearchEngines,
        regenerateSecretToken: selectedLevel === 'secret_link' ? false : undefined,
      });

      // Show secret link if generated
      if (result.secretToken) {
        setShowSecretLink(true);
      }

      // Clear password field after successful update
      setPassword('');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      alert('Failed to update privacy settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerateSecretToken = async () => {
    if (selectedLevel !== 'secret_link') return;

    setIsUpdating(true);
    try {
      await updatePrivacy({
        workspaceId,
        privacyLevel: 'secret_link',
        allowSearchEngines,
        regenerateSecretToken: true,
      });
      setShowSecretLink(true);
    } catch (error) {
      console.error('Failed to regenerate secret token:', error);
      alert('Failed to regenerate secret token');
    } finally {
      setIsUpdating(false);
    }
  };

  const copySecretLink = () => {
    if (!privacySettings?.secretToken) return;
    
    const url = `${window.location.origin}/cv/${window.location.pathname.split('/')[2]}?token=${privacySettings.secretToken}`;
    navigator.clipboard.writeText(url);
    alert('Secret link copied to clipboard!');
  };

  if (!privacySettings) {
    return <div>Loading privacy settings...</div>;
  }

  const privacyLevels = [
    {
      id: 'public',
      name: 'Public',
      description: 'Anyone can view your CV',
      icon: '🌐',
    },
    {
      id: 'secret_link',
      name: 'Secret Link',
      description: 'Only people with the secret link can view your CV',
      icon: '🔗',
    },
    {
      id: 'password',
      name: 'Password Protected',
      description: 'Anyone with the password can view your CV',
      icon: '🔐',
    },
    {
      id: 'private',
      name: 'Private',
      description: 'Only invited collaborators can view your CV',
      icon: '🔒',
    },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Settings</h3>
          <p className="text-sm text-gray-600">
            Control who can access and view your CV
          </p>
        </div>

        {/* Privacy Level Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Privacy Level</label>
          <div className="grid grid-cols-1 gap-3">
            {privacyLevels.map((level) => (
              <label
                key={level.id}
                className={`
                  relative flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                  ${selectedLevel === level.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                `}
              >
                <input
                  type="radio"
                  name="privacyLevel"
                  value={level.id}
                  checked={selectedLevel === level.id}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl" role="img" aria-label={level.name}>
                    {level.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{level.name}</div>
                    <div className="text-sm text-gray-600">{level.description}</div>
                  </div>
                </div>
                {selectedLevel === level.id && (
                  <div className="text-blue-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Password Input for Password Protection */}
        {selectedLevel === 'password' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {privacySettings.hasPassword ? 'Change Password (leave empty to keep current)' : 'Set Password'}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full"
            />
          </div>
        )}

        {/* Secret Link Display */}
        {selectedLevel === 'secret_link' && privacySettings.secretToken && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Secret Link</label>
              <Button
                onClick={handleRegenerateSecretToken}
                disabled={isUpdating}
                className="text-xs"
              >
                Regenerate
              </Button>
            </div>
            <div className="flex space-x-2">
              <Input
                readOnly
                value={`${window.location.origin}/cv/[slug]?token=${privacySettings.secretToken}`}
                className="flex-1 font-mono text-xs"
              />
              <Button onClick={copySecretLink} className="whitespace-nowrap">
                Copy Link
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Share this link to give access to your CV. Keep it secure!
            </p>
          </div>
        )}

        {/* Search Engine Settings */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="allowSearchEngines"
            checked={allowSearchEngines}
            onChange={(e) => setAllowSearchEngines(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="allowSearchEngines" className="text-sm text-gray-700">
            Allow search engines to index this CV
          </label>
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
          <div className="flex items-center space-x-2">
            <span className="text-lg" role="img" aria-label="Privacy level">
              {getPrivacyLevelIcon(privacySettings.level as any)}
            </span>
            <span className="text-sm text-gray-600">
              {getPrivacyLevelDescription(privacySettings.level as any)}
            </span>
          </div>
        </div>

        {/* Update Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleUpdatePrivacy}
            disabled={isUpdating || !selectedLevel}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isUpdating ? 'Updating...' : 'Update Privacy Settings'}
          </Button>
        </div>
      </div>
    </Card>
  );
};