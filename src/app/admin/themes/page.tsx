'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { ThemeSelector } from '@/components/ThemeSelector';
import { TemplateGallery } from '@/components/TemplateGallery';
import { Card } from '@/components/ui/Card';

export default function ThemesPage() {
  const [activeTab, setActiveTab] = useState<'themes' | 'templates'>('themes');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get user's workspaces to find the first one (for now)
  const workspaces = useQuery(api.workspaces.getUserWorkspaces, {});
  const currentWorkspace = workspaces?.[0];
  
  // Get current workspace theme
  const currentWorkspaceTheme = useQuery(
    api.themesAndTemplates.getWorkspaceTheme,
    currentWorkspace ? { workspaceId: (currentWorkspace as any)._id } : 'skip'
  );
  
  const initializeThemes = useMutation(api.themesAndTemplates.initializeBuiltInThemes);
  const initializeTemplates = useMutation(api.themesAndTemplates.initializeBuiltInTemplates);
  
  const handleInitializeThemes = async () => {
    try {
      const result = await initializeThemes({});
      alert(result.message);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to initialize themes:', error);
      alert('Failed to initialize themes. Please try again.');
    }
  };
  
  const handleInitializeTemplates = async () => {
    try {
      const result = await initializeTemplates({});
      alert(result.message);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to initialize templates:', error);
      alert('Failed to initialize templates. Please try again.');
    }
  };
  
  const handleThemeChange = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const handleTemplateApplied = () => {
    setRefreshKey(prev => prev + 1);
    // Optionally switch to themes tab to see the applied theme
    setActiveTab('themes');
  };

  
  if (!workspaces) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading themes...</p>
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
            🎨
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Workspace Found</h2>
          <p className="text-gray-600 mb-6">
            You need to create a workspace first to manage themes and templates.
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create Workspace
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Themes & Templates</h1>
            <p className="text-gray-600 mt-1">
              Customize the look and structure of your CV: {currentWorkspace.name}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleInitializeThemes}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              <span>🎨</span>
              Init Themes
            </button>
            <button
              onClick={handleInitializeTemplates}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
            >
              <span>📋</span>
              Init Templates
            </button>
          </div>
        </div>
        
        {/* Current Theme Status */}
        {currentWorkspaceTheme && (
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                🎨
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Current Theme: {currentWorkspaceTheme.theme?.displayName || 'Default'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {currentWorkspaceTheme.theme?.description || 'No theme selected'}
                </p>
              </div>
              {currentWorkspaceTheme.template && (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Template: {currentWorkspaceTheme.template.displayName}
                  </div>
                  <div className="text-xs text-gray-600">
                    {currentWorkspaceTheme.template.category}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('themes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'themes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🎨</span>
                Themes
              </span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📋</span>
                Templates
              </span>
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Theme</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Select a visual theme to customize colors, typography, and layout of your CV.
                </p>
              </div>
              
              <ThemeSelector
                key={refreshKey}
                workspaceId={(currentWorkspace as any)._id}
                currentThemeId={currentWorkspaceTheme?.theme?._id}
                onThemeChange={handleThemeChange}
              />
            </div>
          )}
          
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">CV Templates</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Choose from professionally designed templates tailored for different industries and experience levels.
                  Templates include both structure and sample content to get you started quickly.
                </p>
              </div>
              
              <TemplateGallery
                key={refreshKey}
                workspaceId={(currentWorkspace as any)._id}
                onTemplateApplied={handleTemplateApplied}
              />
            </div>
          )}
        </div>
        
        {/* Help Text */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0 mt-0.5">
              💡
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Tips for Themes & Templates</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• <strong>Themes</strong> control the visual appearance (colors, fonts, layout) of your CV</p>
                <p>• <strong>Templates</strong> provide complete CV structures with sample content for your industry</p>
                <p>• You can apply a template first for structure, then customize the theme for visual style</p>
                <p>• All changes are automatically saved and immediately reflected in your public CV</p>
                <p>• Custom themes and templates can be created for advanced users</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}