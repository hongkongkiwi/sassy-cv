'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { PrivacySettings } from '@/components/PrivacySettings';
import { PrivacyStatusCard } from '@/components/PrivacyIndicator';
import { Card } from '@/components/ui/Card';
import { PrivacyLevel } from '@/lib/privacy';

export default function PrivacyPage() {
  // Get user's workspaces to find the first one (for now)
  // In a full implementation, you'd select which workspace to manage
  const workspaces = useQuery(api.workspaces.getUserWorkspaces, {});
  const currentWorkspace = workspaces?.[0];

  if (!workspaces) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading privacy settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!currentWorkspace) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-2xl font-bold mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Workspace Found</h2>
          <p className="text-gray-600 mb-6">
            You need to create a workspace first to manage privacy settings.
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create Workspace
          </button>
        </div>
      </AdminLayout>
    );
  }

  const currentPrivacyLevel = currentWorkspace.privacy?.level as PrivacyLevel || 'public';

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacy Settings</h1>
          <p className="text-gray-600 mt-1">
            Control who can access and view your CV: {currentWorkspace.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Status */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
              <PrivacyStatusCard level={currentPrivacyLevel}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Public URL:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      /cv/{currentWorkspace.slug}
                    </code>
                  </div>
                  
                  {currentPrivacyLevel === 'secret_link' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Secret Link:</span>
                      <span className="text-blue-600 text-xs">Available in settings</span>
                    </div>
                  )}
                  
                  {currentPrivacyLevel === 'password' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Password:</span>
                      <span className="text-green-600 text-xs">Protected ✓</span>
                    </div>
                  )}
                </div>
              </PrivacyStatusCard>
            </div>

            {/* Quick Stats */}
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Access Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Search Engine Indexing:</span>
                  <span className={`font-medium ${
                    currentWorkspace.privacy?.allowSearchEngines 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {currentWorkspace.privacy?.allowSearchEngines ? 'Allowed' : 'Blocked'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collaborators:</span>
                  <span className="text-gray-900">Always have access</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Analytics Tracking:</span>
                  <span className="text-green-600">Active</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Privacy Settings Form */}
          <div>
            {currentWorkspace && (
              <PrivacySettings workspaceId={(currentWorkspace as any)._id} />
            )}
          </div>
        </div>

        {/* Privacy Levels Explanation */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Levels Explained</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-xl" role="img" aria-label="Public">🌐</span>
                <div>
                  <h4 className="font-medium text-gray-900">Public</h4>
                  <p className="text-sm text-gray-600">
                    Anyone can find and view your CV. Good for maximum exposure.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-xl" role="img" aria-label="Secret Link">🔗</span>
                <div>
                  <h4 className="font-medium text-gray-900">Secret Link</h4>
                  <p className="text-sm text-gray-600">
                    Only people with the secret link can access your CV. Perfect for sharing with specific contacts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-xl" role="img" aria-label="Password Protected">🔐</span>
                <div>
                  <h4 className="font-medium text-gray-900">Password Protected</h4>
                  <p className="text-sm text-gray-600">
                    Anyone with the password can view your CV. Good for controlled but broader access.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-xl" role="img" aria-label="Private">🔒</span>
                <div>
                  <h4 className="font-medium text-gray-900">Private</h4>
                  <p className="text-sm text-gray-600">
                    Only invited collaborators can view your CV. Maximum privacy and control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}