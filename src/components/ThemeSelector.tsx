'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Card } from './ui/Card';

interface ThemeSelectorProps {
  workspaceId: Id<'workspaces'>;
  currentThemeId?: Id<'themes'>;
  onThemeChange?: (themeId: Id<'themes'>) => void;
}

interface ThemePreviewProps {
  theme: any;
  isSelected: boolean;
  onSelect: () => void;
  isApplying: boolean;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, isSelected, onSelect, isApplying }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-gray-300'
      } ${isApplying ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      <div className="p-4 space-y-3">
        {/* Theme Preview */}
        <div className="h-32 rounded-lg overflow-hidden relative" style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}20)`,
          border: `1px solid ${theme.colors.border}`,
        }}>
          {/* Mini CV Preview */}
          <div className="p-3 space-y-2 h-full">
            <div 
              className="h-2 rounded-full w-3/4"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div 
              className="h-1 rounded w-1/2"
              style={{ backgroundColor: theme.colors.text.secondary }}
            />
            <div className="space-y-1">
              <div 
                className="h-1 rounded w-full"
                style={{ backgroundColor: theme.colors.text.muted }}
              />
              <div 
                className="h-1 rounded w-4/5"
                style={{ backgroundColor: theme.colors.text.muted }}
              />
            </div>
            <div 
              className="h-3 rounded w-2/3 mt-2"
              style={{ backgroundColor: theme.colors.accent }}
            />
          </div>
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              ✓
            </div>
          )}
          
          {/* Loading indicator */}
          {isApplying && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Theme Info */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 text-sm">{theme.displayName}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              theme.isBuiltIn 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {theme.isBuiltIn ? 'Built-in' : 'Custom'}
            </span>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{theme.description}</p>
        </div>
        
        {/* Color Palette */}
        <div className="flex gap-1">
          <div 
            className="w-3 h-3 rounded-full border border-gray-200"
            style={{ backgroundColor: theme.colors.primary }}
            title="Primary"
          />
          <div 
            className="w-3 h-3 rounded-full border border-gray-200"
            style={{ backgroundColor: theme.colors.secondary }}
            title="Secondary"
          />
          <div 
            className="w-3 h-3 rounded-full border border-gray-200"
            style={{ backgroundColor: theme.colors.accent }}
            title="Accent"
          />
          <div 
            className="w-3 h-3 rounded-full border border-gray-200"
            style={{ backgroundColor: theme.colors.text.primary }}
            title="Text"
          />
        </div>
      </div>
    </Card>
  );
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  workspaceId, 
  currentThemeId, 
  onThemeChange 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [applyingThemeId, setApplyingThemeId] = useState<Id<'themes'> | null>(null);
  
  const themes = useQuery(api.themesAndTemplates.getThemes, {
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    includeCustom: true,
  });
  
  const currentWorkspaceTheme = useQuery(api.themesAndTemplates.getWorkspaceTheme, {
    workspaceId,
  });
  
  const applyTheme = useMutation(api.themesAndTemplates.applyTheme);
  
  const categories = [
    { value: 'all', label: 'All Themes' },
    { value: 'professional', label: 'Professional' },
    { value: 'creative', label: 'Creative' },
    { value: 'academic', label: 'Academic' },
    { value: 'technical', label: 'Technical' },
  ];
  
  const handleThemeSelect = async (themeId: Id<'themes'>) => {
    if (themeId === currentThemeId || applyingThemeId) return;
    
    setApplyingThemeId(themeId);
    
    try {
      await applyTheme({
        workspaceId,
        themeId,
      });
      
      onThemeChange?.(themeId);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      alert('Failed to apply theme. Please try again.');
    } finally {
      setApplyingThemeId(null);
    }
  };
  
  if (!themes) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
      
      {/* Current Theme Info */}
      {currentWorkspaceTheme?.theme && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm">🎨</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Current Theme</h3>
              <p className="text-blue-700 text-sm">{currentWorkspaceTheme.theme.displayName}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <ThemePreview
            key={theme._id}
            theme={theme}
            isSelected={theme._id === currentThemeId || theme._id === currentWorkspaceTheme?.theme?._id}
            onSelect={() => handleThemeSelect(theme._id)}
            isApplying={applyingThemeId === theme._id}
          />
        ))}
      </div>
      
      {themes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-2xl font-bold mx-auto mb-4">
            🎨
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Themes Found</h3>
          <p className="text-gray-600">
            {selectedCategory === 'all' 
              ? 'No themes are available at the moment.'
              : `No themes found in the ${categories.find(c => c.value === selectedCategory)?.label} category.`
            }
          </p>
        </div>
      )}
    </div>
  );
};