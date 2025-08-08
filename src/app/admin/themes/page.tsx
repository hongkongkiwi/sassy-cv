'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemesPage() {
  const { userId } = useAuth();
  const { themes, currentTheme, setTheme, isLoading } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  
  const seedThemes = useMutation(api.themes.seedDefaultThemes);

  const handleSeedThemes = async () => {
    try {
      await seedThemes({});
      alert('Default themes have been created!');
    } catch (error) {
      console.error('Failed to seed themes:', error);
    }
  };

  const handlePreviewTheme = (themeId: string) => {
    setPreviewTheme(themeId);
    const theme = themes.find(t => t._id === themeId);
    if (theme) {
      // Temporarily apply theme for preview
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.colors.primary);
      root.style.setProperty('--color-secondary', theme.colors.secondary);
      root.style.setProperty('--color-accent', theme.colors.accent);
    }
  };

  const handleApplyTheme = async (themeId: string) => {
    await setTheme(themeId);
    setPreviewTheme(null);
  };

  const handleCancelPreview = () => {
    setPreviewTheme(null);
    if (currentTheme) {
      // Restore current theme
      const root = document.documentElement;
      root.style.setProperty('--color-primary', currentTheme.colors.primary);
      root.style.setProperty('--color-secondary', currentTheme.colors.secondary);
      root.style.setProperty('--color-accent', currentTheme.colors.accent);
    }
  };

  const ThemePreview = ({ theme }: { theme: any }) => {
    const isSelected = currentTheme?._id === theme._id;
    const isPreviewing = previewTheme === theme._id;

    return (
      <Card 
        hover 
        className={`cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${isPreviewing ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}
      >
        <div className="space-y-4">
          {/* Theme Preview */}
          <div className="h-32 rounded-lg overflow-hidden border border-gray-200">
            <div 
              className="h-full flex flex-col"
              style={{ backgroundColor: theme.colors.background }}
            >
              {/* Header */}
              <div 
                className="h-8 flex items-center px-3"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <div className="w-16 h-1.5 bg-white bg-opacity-60 rounded"></div>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-3 space-y-2">
                <div 
                  className="h-3 w-20 rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.8 }}
                ></div>
                <div 
                  className="h-2 w-full rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.3 }}
                ></div>
                <div 
                  className="h-2 w-3/4 rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.3 }}
                ></div>
                <div className="flex gap-1 pt-1">
                  <div 
                    className="h-4 w-8 rounded text-xs flex items-center justify-center text-white"
                    style={{ backgroundColor: theme.colors.accent }}
                  ></div>
                  <div 
                    className="h-4 w-8 rounded"
                    style={{ backgroundColor: theme.colors.secondary, opacity: 0.3 }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Info */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{theme.displayName}</h3>
              {isSelected && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Current
                </span>
              )}
              {isPreviewing && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  Preview
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
            
            {/* Color Palette */}
            <div className="flex gap-2 mb-3">
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: theme.colors.primary }}
                title="Primary"
              />
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: theme.colors.secondary }}
                title="Secondary"
              />
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: theme.colors.accent }}
                title="Accent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!isSelected && !isPreviewing && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePreviewTheme(theme._id)}
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApplyTheme(theme._id)}
                  >
                    Apply
                  </Button>
                </>
              )}
              
              {isPreviewing && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCancelPreview}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApplyTheme(theme._id)}
                  >
                    Apply
                  </Button>
                </>
              )}
              
              {isSelected && (
                <Button size="sm" variant="success" disabled>
                  Applied
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (!userId) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Theme Customization</h1>
          <p className="text-gray-600">Please sign in to customize themes.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Theme Customization</h1>
          <p className="text-gray-600 mt-2">
            Choose a professional theme that reflects your personal brand
          </p>
        </div>

        {/* Preview Notice */}
        {previewTheme && (
          <Card className="bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">👁️</div>
                <div>
                  <h3 className="font-medium text-purple-900">Theme Preview Active</h3>
                  <p className="text-sm text-purple-700">
                    You're previewing a theme. Apply it to make it permanent or cancel to revert.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleCancelPreview}>
                Cancel Preview
              </Button>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading themes...</p>
          </div>
        ) : themes.length === 0 ? (
          <Card className="text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Themes Available</h3>
            <p className="text-gray-600 mb-6">
              It looks like the default themes haven't been created yet.
            </p>
            <Button onClick={handleSeedThemes} variant="primary">
              Create Default Themes
            </Button>
          </Card>
        ) : (
          <>
            {/* Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((theme) => (
                <ThemePreview key={theme._id} theme={theme} />
              ))}
            </div>

            {/* Tips */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Theme Tips</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Choosing the Right Theme</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Modern:</strong> Great for tech and startup roles</li>
                    <li>• <strong>Classic:</strong> Perfect for corporate and executive positions</li>
                    <li>• <strong>Minimal:</strong> Ideal for any industry, content-focused</li>
                    <li>• <strong>Creative:</strong> Best for design and creative roles</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Theme Impact</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Themes apply to both web and PDF versions</li>
                    <li>• Colors remain consistent across all platforms</li>
                    <li>• Preview before applying to see changes</li>
                    <li>• Your current theme is saved automatically</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}