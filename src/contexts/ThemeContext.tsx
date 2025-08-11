'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface Theme {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: string;
  isActive: boolean;
}

interface ThemeContextType {
  themes: Theme[];
  currentTheme: Theme | null;
  isLoading: boolean;
  setTheme: (themeId: string) => Promise<void>;
  applyTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const defaultTheme: Theme = {
  _id: 'default',
  name: 'modern',
  displayName: 'Modern Professional',
  description: 'Clean, contemporary design with blue accents',
  colors: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#06b6d4',
    background: '#ffffff',
    text: '#1f2937',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
  layout: 'modern',
  isActive: true,
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(defaultTheme);

  // Get the first workspace for the user
  const cvData = useQuery(api.cv.getAllCVData, userId ? {} : 'skip');
  const workspaceId = cvData?.contactInfo?.workspaceId;

  const themesQuery = useQuery(api.themes.getThemes, {});
  const themes = useMemo(() => themesQuery ?? [], [themesQuery]);
  const userSettings = useQuery(api.themes.getUserSettings, workspaceId ? { workspaceId } : 'skip');
  const updateSettings = useMutation(api.themes.updateUserSettings);

  const isLoading = themesQuery === undefined;

  // Apply theme to document
  const applyTheme = (theme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.colors.primary);
      root.style.setProperty('--color-secondary', theme.colors.secondary);
      root.style.setProperty('--color-accent', theme.colors.accent);
      root.style.setProperty('--color-background', theme.colors.background);
      root.style.setProperty('--color-text', theme.colors.text);
      root.style.setProperty('--font-heading', theme.fonts.heading);
      root.style.setProperty('--font-body', theme.fonts.body);
    }
  };

  // Set theme and save to database
  const setTheme = async (themeId: string) => {
    const theme = themes.find(t => t._id === themeId);
    if (theme && workspaceId) {
      setCurrentTheme(theme as any);
      applyTheme(theme as any);
      
      try {
        await updateSettings({
          workspaceId,
          selectedTheme: themeId as any,
        });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  // Initialize theme on load
  useEffect(() => {
    if (themes.length > 0) {
      let themeToApply = defaultTheme;
      
      if (userSettings?.selectedTheme) {
        const savedTheme = themes.find(t => t._id === userSettings.selectedTheme);
        if (savedTheme) {
          themeToApply = savedTheme as any;
        }
      } else {
        // Use first available theme as default
        themeToApply = (themes[0] as any) || defaultTheme;
      }
      
      setCurrentTheme(themeToApply);
      applyTheme(themeToApply);
    }
  }, [themes, userSettings]);

  return (
    <ThemeContext.Provider 
      value={{
        themes: themes as any,
        currentTheme,
        isLoading,
        setTheme,
        applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};