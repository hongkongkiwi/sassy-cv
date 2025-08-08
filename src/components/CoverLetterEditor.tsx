'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CoverLetterEditorProps {
  letterId: string;
  onClose: () => void;
}

export const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({
  letterId,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const coverLetter = useQuery(api.coverLetters.getCoverLetter, { id: letterId as any });
  const updateCoverLetter = useMutation(api.coverLetters.updateCoverLetter);

  // Load data when cover letter is fetched
  useEffect(() => {
    if (coverLetter) {
      setTitle(coverLetter.title);
      setContent(coverLetter.content);
      setCompany(coverLetter.company || '');
      setJobTitle(coverLetter.jobTitle || '');
    }
  }, [coverLetter]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide both a title and content');
      return;
    }

    setSaving(true);
    try {
      await updateCoverLetter({
        id: letterId as any,
        title,
        content,
        company: company || undefined,
        jobTitle: jobTitle || undefined,
      });
      
      setHasChanges(false);
      alert('Cover letter updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges && confirm('You have unsaved changes. Are you sure you want to leave?')) {
      onClose();
    } else if (!hasChanges) {
      onClose();
    }
  };

  const handleChange = (field: string, value: string) => {
    setHasChanges(true);
    
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'content':
        setContent(value);
        break;
      case 'company':
        setCompany(value);
        break;
      case 'jobTitle':
        setJobTitle(value);
        break;
    }
  };

  if (!coverLetter) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading cover letter...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Cover Letter</h1>
          <p className="text-gray-600 mt-2">
            Make changes to your cover letter content and details
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleClose} variant="secondary">
            Back to Cover Letters
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Status */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="text-yellow-500">⚠️</div>
            <p className="text-sm text-yellow-800">You have unsaved changes</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Cover letter title"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Company name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                    placeholder="Position title"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content</h3>
            <textarea
              value={content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={20}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
              placeholder="Write your cover letter content here..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                {content.length} characters, ~{Math.ceil(content.split(' ').length / 250)} pages
              </p>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigator.clipboard.writeText(content)}
              >
                Copy to Clipboard
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Letter Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="text-gray-900">
                  {new Date(coverLetter.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <p className="text-gray-900">
                  {new Date(coverLetter.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="text-gray-900">
                  {coverLetter.isTemplate ? 'Template' : 'Cover Letter'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const printContent = `
                    <html>
                      <head><title>${title}</title></head>
                      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1>${title}</h1>
                        <pre style="white-space: pre-wrap; font-family: inherit;">${content}</pre>
                      </body>
                    </html>
                  `;
                  const printWindow = window.open('', '_blank');
                  printWindow?.document.write(printContent);
                  printWindow?.document.close();
                  printWindow?.print();
                }}
              >
                🖨️ Print
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([content], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = `${title}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                💾 Download as Text
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full"
                onClick={() => navigator.clipboard.writeText(content)}
              >
                📋 Copy to Clipboard
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">✍️ Writing Tips</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Keep it to one page (3-4 paragraphs)</li>
              <li>• Start with a strong opening</li>
              <li>• Use specific examples</li>
              <li>• Match the company's tone</li>
              <li>• End with a call to action</li>
              <li>• Proofread for errors</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};