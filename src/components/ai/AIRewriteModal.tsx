'use client';

import React, { useState } from 'react';
import { AIProviderSelector } from './AIProviderSelector';
import { isAIAvailable } from '@/lib/deploy';
import { AIProvider, getDefaultProvider } from '@/lib/ai-providers';

interface AIRewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  originalContent: string | string[];
  onRewrite: (rewrittenContent: string) => void;
}

export const AIRewriteModal: React.FC<AIRewriteModalProps> = ({
  isOpen,
  onClose,
  section,
  originalContent,
  onRewrite
}) => {
  const [provider, setProvider] = useState<AIProvider>(getDefaultProvider());
  const [instructions, setInstructions] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('similar');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState('');

  const handleRewrite = async () => {
    if (!isAIAvailable) {
      alert('AI rewrite is disabled in this environment.');
      return;
    }
    setIsRewriting(true);
    try {
      const response = await fetch('/api/ai/rewrite-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          content: originalContent,
          instructions,
          provider,
          tone,
          length
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rewrite content');
      }

      const data = await response.json();
      setRewrittenContent(data.rewrittenContent);
    } catch (error) {
      console.error('Error rewriting content:', error);
      alert('Failed to rewrite content. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAccept = () => {
    onRewrite(rewrittenContent);
    onClose();
    setRewrittenContent('');
    setInstructions('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">AI Rewrite: {section}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Content */}
            <div>
              <h3 className="font-medium mb-2">Original Content</h3>
              <div className="border rounded-md p-3 bg-gray-50 h-32 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">
                  {Array.isArray(originalContent) ? originalContent.join('\n• ') : originalContent}
                </p>
              </div>
            </div>

            {/* Rewritten Content */}
            <div>
              <h3 className="font-medium mb-2">AI Rewritten Content</h3>
              <div className="border rounded-md p-3 bg-blue-50 h-32 overflow-y-auto">
                {rewrittenContent ? (
                  <p className="text-sm whitespace-pre-wrap">{rewrittenContent}</p>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    Click &quot;Rewrite with AI&quot; to generate improved content
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {isAIAvailable && (
              <AIProviderSelector
                selectedProvider={provider}
                onProviderChange={setProvider}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="professional">Professional</option>
                <option value="confident">Confident</option>
                <option value="conversational">Conversational</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="shorter">Shorter</option>
                <option value="similar">Similar Length</option>
                <option value="longer">Longer</option>
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border rounded-md px-3 py-2 h-20"
              placeholder="e.g., Focus on leadership experience, emphasize specific technologies, make it more results-oriented..."
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={handleRewrite}
              disabled={!isAIAvailable || isRewriting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRewriting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Rewriting...
                </>
              ) : (
                '✨ Rewrite with AI'
              )}
            </button>

            <div className="flex gap-2">
              {rewrittenContent && (
                <button
                  onClick={handleAccept}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Accept Rewrite
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};