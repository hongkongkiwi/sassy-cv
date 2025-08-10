"use client";

import { isAIAvailable } from '@/lib/deploy';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { CVAnalysis } from '@/components/ai/CVAnalysis';
import { AIProviderSelector } from '@/components/ai/AIProviderSelector';
import { AIProvider, getDefaultProvider } from '@/lib/ai-providers';
import { CVData } from '@/types/cv';

interface Suggestion {
  type: 'add' | 'improve' | 'remove' | 'reorder';
  section: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  example?: string;
}

export default function AIAnalysisPage() {
  const { userId } = useAuth();
  const [provider, setProvider] = useState<AIProvider>(getDefaultProvider());
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const cvDataFromDB = useQuery(api.cv.getAllCVData, {});

  // Transform Convex data to match CVData interface
  const transformedCVData: CVData | null = cvDataFromDB ? {
    contact: cvDataFromDB.contactInfo ? {
      name: cvDataFromDB.contactInfo.name,
      title: cvDataFromDB.contactInfo.title,
      email: cvDataFromDB.contactInfo.email,
      phone: cvDataFromDB.contactInfo.phone,
      location: cvDataFromDB.contactInfo.location,
      linkedin: cvDataFromDB.contactInfo.linkedin,
      github: cvDataFromDB.contactInfo.github,
      website: cvDataFromDB.contactInfo.website,
    } : {
      name: 'Your Name',
      title: 'Principal Software Engineer',
      email: 'email@example.com',
      location: 'Location',
    },
    summary: cvDataFromDB.contactInfo?.summary || 'Professional summary not set',
    experience: cvDataFromDB.experiences.map((exp) => ({
      id: exp._id,
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate || null,
      location: exp.location,
      description: exp.description,
      technologies: exp.technologies,
    })),
    skills: cvDataFromDB.skills.map(skill => ({
      category: skill.category,
      items: skill.items,
    })),
    projects: cvDataFromDB.projects.map(project => ({
      id: project._id,
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      url: project.url,
      github: project.github,
    })),
    education: cvDataFromDB.education.map(edu => ({
      id: edu._id,
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      location: edu.location,
      description: edu.description,
    })),
  } : null;

  const handleGenerateSuggestions = async () => {
    if (!transformedCVData) return;

    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch('/api/ai/suggest-improvements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvData: transformedCVData,
          targetRole,
          provider
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return '➕';
      case 'improve': return '🔧';
      case 'remove': return '🗑️';
      case 'reorder': return '🔄';
      default: return '📝';
    }
  };

  if (!userId) return <div>Please sign in</div>;

  if (!transformedCVData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Analysis</h1>
          <p className="text-gray-600 mb-4">Please add some CV content before running AI analysis.</p>
          <a href="/admin/contact" className="text-blue-600 hover:underline">
            Start by adding your contact information →
          </a>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI CV Analysis</h1>
          <p className="text-gray-600 mt-2">
            Get comprehensive AI-powered feedback on your CV to improve your job application success rate.
          </p>
        </div>
        {isAIAvailable ? (
          // CV Analysis Component (only when server APIs available)
          <CVAnalysis cvData={transformedCVData} />
        ) : (
          <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
            AI features are disabled for this environment.
          </div>
        )}

        {/* Improvement Suggestions */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Improvement Suggestions</h2>
          
          <div className="flex items-end gap-4 mb-6">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="e.g., Senior Software Engineer, Full Stack Developer"
              />
            </div>

            {isAIAvailable && (
              <AIProviderSelector
                selectedProvider={provider}
                onProviderChange={setProvider}
                className="flex-1 max-w-xs"
              />
            )}
            
            <button
              onClick={handleGenerateSuggestions}
              disabled={!isAIAvailable || isGeneratingSuggestions}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeneratingSuggestions ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  💡 Get Suggestions
                </>
              )}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personalized Recommendations</h3>
              
              {/* Priority Filter */}
              <div className="flex gap-2 mb-4">
                {['high', 'medium', 'low'].map((priority) => {
                  const count = suggestions.filter(s => s.priority === priority).length;
                  return (
                    <span
                      key={priority}
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(priority)}`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} ({count})
                    </span>
                  );
                })}
              </div>

              <div className="grid gap-4">
                {suggestions
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                  })
                  .map((suggestion, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <span className="text-sm text-gray-500 capitalize">
                            ({suggestion.section})
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{suggestion.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600 font-medium">
                          Impact: {suggestion.estimatedImpact}
                        </span>
                      </div>
                      
                      {suggestion.example && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>Example:</strong> {suggestion.example}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}