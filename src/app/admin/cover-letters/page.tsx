'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CoverLetterGenerator } from '@/components/CoverLetterGenerator';
import { CoverLetterEditor } from '@/components/CoverLetterEditor';

export default function CoverLettersPage() {
  const { userId } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingLetter, setEditingLetter] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  
  const coverLetters = useQuery(api.coverLetters.getCoverLetters, 
    userId ? { userId } : 'skip'
  ) || [];
  
  const templates = useQuery(api.coverLetters.getTemplates,
    userId ? { userId } : 'skip'
  ) || [];
  
  const createDefaultTemplates = useMutation(api.coverLetters.createDefaultTemplates);
  const deleteCoverLetter = useMutation(api.coverLetters.deleteCoverLetter);
  const duplicateCoverLetter = useMutation(api.coverLetters.duplicateCoverLetter);

  const regularLetters = coverLetters.filter(letter => !letter.isTemplate);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreateTemplates = async () => {
    try {
      await createDefaultTemplates({ userId: userId! });
      alert('Default templates created successfully!');
    } catch (error) {
      console.error('Failed to create templates:', error);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (confirm('Are you sure you want to delete this cover letter?')) {
      try {
        await deleteCoverLetter({ id: id as any });
      } catch (error) {
        console.error('Failed to delete cover letter:', error);
      }
    }
  };

  const handleDuplicateLetter = async (id: string) => {
    try {
      await duplicateCoverLetter({ id: id as any });
    } catch (error) {
      console.error('Failed to duplicate cover letter:', error);
    }
  };

  if (!userId) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cover Letter Generator</h1>
          <p className="text-gray-600">Please sign in to create cover letters.</p>
        </div>
      </AdminLayout>
    );
  }

  if (showGenerator) {
    return (
      <AdminLayout>
        <CoverLetterGenerator 
          userId={userId}
          onClose={() => setShowGenerator(false)}
        />
      </AdminLayout>
    );
  }

  if (editingLetter) {
    return (
      <AdminLayout>
        <CoverLetterEditor 
          letterId={editingLetter}
          onClose={() => setEditingLetter(null)}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cover Letters</h1>
            <p className="text-gray-600 mt-2">
              Create AI-powered cover letters tailored to specific job applications
            </p>
          </div>
          <Button onClick={() => setShowGenerator(true)}>
            ✨ Generate Cover Letter
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card 
            hover 
            className="cursor-pointer text-center p-6"
            onClick={() => setShowGenerator(true)}
          >
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Generator</h3>
            <p className="text-sm text-gray-600">Create a new cover letter with AI assistance</p>
          </Card>
          
          <Card hover className="cursor-pointer text-center p-6">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-semibold text-gray-900 mb-2">Blank Letter</h3>
            <p className="text-sm text-gray-600">Start from scratch with a blank template</p>
          </Card>
          
          <Card hover className="cursor-pointer text-center p-6">
            <div className="text-4xl mb-3">📁</div>
            <h3 className="font-semibold text-gray-900 mb-2">From Template</h3>
            <p className="text-sm text-gray-600">Use one of your saved templates</p>
          </Card>
        </div>

        {/* Recent Cover Letters */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Cover Letters</h3>
            <Button variant="secondary" size="sm">
              View All
            </Button>
          </div>
          
          {regularLetters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📄</div>
              <h4 className="font-medium text-gray-900 mb-2">No cover letters yet</h4>
              <p className="text-gray-600 mb-6">
                Create your first cover letter using our AI-powered generator.
              </p>
              <Button onClick={() => setShowGenerator(true)}>
                Create First Cover Letter
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {regularLetters.slice(0, 5).map((letter) => (
                <div 
                  key={letter._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{letter.title}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      {letter.company && <span>📍 {letter.company}</span>}
                      {letter.jobTitle && <span>💼 {letter.jobTitle}</span>}
                      <span>📅 {formatDate(letter.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setEditingLetter(letter._id)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDuplicateLetter(letter._id)}
                    >
                      Duplicate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteLetter(letter._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Templates */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
            {templates.length === 0 && (
              <Button variant="secondary" size="sm" onClick={handleCreateTemplates}>
                Create Default Templates
              </Button>
            )}
          </div>
          
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📋</div>
              <h4 className="font-medium text-gray-900 mb-2">No templates yet</h4>
              <p className="text-gray-600 mb-4">
                Create reusable templates to speed up your cover letter writing process.
              </p>
              <Button variant="secondary" onClick={handleCreateTemplates}>
                Create Default Templates
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template._id} hover className="cursor-pointer p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {template.content.substring(0, 150)}...
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary">
                      Use Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setEditingLetter(template._id)}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Tips */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Cover Letter Tips</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Writing Best Practices</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keep it concise (3-4 paragraphs maximum)</li>
                <li>• Customize for each specific job and company</li>
                <li>• Highlight relevant achievements and skills</li>
                <li>• Use specific examples from your experience</li>
                <li>• Show enthusiasm for the role and company</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">AI Generator Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Analyzes your CV data automatically</li>
                <li>• Matches qualifications to job requirements</li>
                <li>• Creates personalized, professional content</li>
                <li>• Supports multiple AI providers</li>
                <li>• Generates different styles and tones</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}