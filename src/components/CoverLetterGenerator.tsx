"use client";

import { isAIAvailable } from '@/lib/deploy';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CoverLetterGeneratorProps {
  userId: string;
  onClose: () => void;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  userId,
  onClose,
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [provider, setProvider] = useState<'openai' | 'google'>('openai');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');

  // Fetch CV data
  const contactInfo = useQuery(api.cv.getContactInfo, {}) as any;
  const experiences = useQuery(api.cv.getExperiences, {}) || [];
  const skills = useQuery(api.cv.getSkills, {}) || [];
  const education = useQuery(api.cv.getEducation, {}) || [];

  const createCoverLetter = useMutation(api.coverLetters.createCoverLetter);

  const cvData = {
    contactInfo: contactInfo || null,
    experiences: experiences.slice(0, 5), // Most recent experiences
    skills,
    education,
  };

  const handleGenerate = async () => {
    if (!isAIAvailable) {
      alert('AI generation is disabled in this environment.');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvData,
          jobDescription,
          company,
          position,
          provider,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setGeneratedContent(data.coverLetter);
      
      // Auto-generate title
      const autoTitle = `${position || 'Position'} at ${company || 'Company'} - ${new Date().toLocaleDateString()}`;
      setTitle(autoTitle);
    } catch (error: any) {
      console.error('Generation error:', error);
      alert(error.message || 'Failed to generate cover letter. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent.trim() || !title.trim()) {
      alert('Please provide a title for your cover letter');
      return;
    }

    setSaving(true);
    try {
      await createCoverLetter({
        userId,
        title,
        content: generatedContent,
        jobTitle: position || undefined,
        company: company || undefined,
      });
      
      alert('Cover letter saved successfully!');
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save cover letter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Cover Letter Generator</h1>
          <p className="text-gray-600 mt-2">
            Create a personalized cover letter based on your CV and the job requirements
          </p>
        </div>
        <Button onClick={onClose} variant="secondary">
          Back to Cover Letters
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google, Microsoft, Startup Inc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Title
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Senior Software Engineer, Product Manager"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here. Include requirements, responsibilities, and any specific qualifications mentioned..."
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  The more detailed the job description, the better the AI can tailor your cover letter.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'openai' | 'google')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="openai">OpenAI GPT-4</option>
                <option value="google">Google Gemini</option>
              </select>
            </div>
          </Card>

          <Button 
            onClick={handleGenerate}
            disabled={!isAIAvailable || generating || !jobDescription.trim()}
            className="w-full"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating Cover Letter...
              </div>
            ) : (
              '✨ Generate Cover Letter'
            )}
          </Button>
        </div>

        {/* Generated Content */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your CV Summary</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Name:</strong> {cvData.contactInfo?.name || 'Not provided'}</p>
              <p><strong>Title:</strong> {cvData.contactInfo?.title || 'Not provided'}</p>
              <p><strong>Experience:</strong> {experiences.length} positions</p>
              <p><strong>Skills:</strong> {skills.reduce((total, category) => total + category.items.length, 0)} skills</p>
              <p><strong>Education:</strong> {education.length} entries</p>
            </div>
          </Card>

          {generatedContent && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Generated Cover Letter</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerate}
                    variant="secondary"
                    size="sm"
                    disabled={generating}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Give your cover letter a title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={16}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="flex-1"
                  >
                    {saving ? 'Saving...' : 'Save Cover Letter'}
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(generatedContent)}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {!generatedContent && (
            <Card className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="font-medium text-gray-900 mb-2">Ready to Generate</h4>
              <p className="text-gray-600">
                Fill in the job information and click &quot;Generate Cover Letter&quot; to create your personalized cover letter.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Tips */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Tips for Best Results</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Include the complete job posting</li>
              <li>• Don&#39;t edit or summarize the requirements</li>
              <li>• Include company culture information if available</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Company Research</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Mention specific company values or missions</li>
              <li>• Reference recent company news or achievements</li>
              <li>• Show knowledge of their products or services</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Customization</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Review and edit the generated content</li>
              <li>• Add personal touches and specific examples</li>
              <li>• Ensure the tone matches the company culture</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};