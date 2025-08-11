'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Card } from './ui/Card';

interface TemplateGalleryProps {
  workspaceId: Id<'workspaces'>;
  onTemplateApplied?: () => void;
}

interface TemplateCardProps {
  template: any;
  onApply: () => void;
  isApplying: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onApply, isApplying }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <div className="p-6 space-y-4">
        {/* Template Preview */}
        <div className="h-48 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 overflow-hidden relative">
          {/* Template Layout Preview */}
          <div className="p-4 space-y-3 h-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              <div className="space-y-1">
                <div className="h-2 bg-gray-700 rounded w-24"></div>
                <div className="h-1 bg-gray-500 rounded w-16"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-1 bg-gray-400 rounded w-full"></div>
              <div className="h-1 bg-gray-400 rounded w-5/6"></div>
              <div className="h-1 bg-gray-400 rounded w-4/5"></div>
            </div>
            
            <div className="flex gap-2">
              <div className="h-4 bg-blue-400 rounded w-20"></div>
              <div className="h-4 bg-purple-400 rounded w-24"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
            </div>
          </div>
          
          {isApplying && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Applying...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Template Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {template.displayName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
              {template.difficulty}
            </span>
          </div>
          
          {/* Tags and Industry */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {template.industry.slice(0, 3).map((ind: string) => (
                <span key={ind} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {ind}
                </span>
              ))}
              {template.industry.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{template.industry.length - 3}
                </span>
              )}
            </div>
            
            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span>⏱️</span>
                {Math.ceil(template.estimatedTime / 60)} min
              </span>
              <span className="flex items-center gap-1">
                <span>👥</span>
                {template.usageCount} uses
              </span>
            </div>
            <span className="text-xs">
              {template.experience} level
            </span>
          </div>
        </div>
        
        {/* Apply Button */}
        <button
          onClick={onApply}
          disabled={isApplying}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isApplying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Applying...
            </>
          ) : (
            <>
              <span>✨</span>
              Apply Template
            </>
          )}
        </button>
      </div>
    </Card>
  );
};

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ workspaceId, onTemplateApplied }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedExperience, setSelectedExperience] = useState<string>('all');
  const [applyingTemplateId, setApplyingTemplateId] = useState<Id<'templates'> | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    template: any;
    keepData: boolean;
  } | null>(null);
  
  const templates = useQuery(api.themesAndTemplates.getTemplates, {
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    industry: selectedIndustry === 'all' ? undefined : [selectedIndustry],
    experience: selectedExperience === 'all' ? undefined : selectedExperience,
    includeCustom: true,
  });
  
  const applyTemplate = useMutation(api.themesAndTemplates.applyTemplate);
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'tech', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'creative', label: 'Creative' },
    { value: 'academic', label: 'Academic' },
    { value: 'executive', label: 'Executive' },
  ];
  
  const industries = [
    { value: 'all', label: 'All Industries' },
    { value: 'software', label: 'Software' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'education', label: 'Education' },
  ];
  
  const experienceLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' },
  ];
  
  const handleTemplateApply = (template: any) => {
    setShowConfirmDialog({ template, keepData: true });
  };
  
  const confirmApplyTemplate = async () => {
    if (!showConfirmDialog) return;
    
    const { template, keepData } = showConfirmDialog;
    setApplyingTemplateId(template._id);
    setShowConfirmDialog(null);
    
    try {
      await applyTemplate({
        workspaceId,
        templateId: template._id,
        keepExistingData: keepData,
      });
      
      onTemplateApplied?.();
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply template. Please try again.');
    } finally {
      setApplyingTemplateId(null);
    }
  };
  
  if (!templates) {
    return (
      <div className="space-y-6">
        {/* Filter skeletons */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
          ))}
        </div>
        
        {/* Template grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">Category:</label>
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">Industry:</label>
            {industries.map((industry) => (
              <button
                key={industry.value}
                onClick={() => setSelectedIndustry(industry.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedIndustry === industry.value
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {industry.label}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">Experience:</label>
            {experienceLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedExperience(level.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedExperience === level.value
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template._id}
            template={template}
            onApply={() => handleTemplateApply(template)}
            isApplying={applyingTemplateId === template._id}
          />
        ))}
      </div>
      
      {templates.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-3xl font-bold mx-auto mb-4">
            📋
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Templates Found</h3>
          <p className="text-gray-600 mb-6">
            No templates match your current filter criteria. Try adjusting your filters or browse all templates.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedIndustry('all');
              setSelectedExperience('all');
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-4">
                ✨
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Apply &quot;{showConfirmDialog.template.displayName}&quot; Template?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                This will update your CV structure and optionally replace your content with sample data.
              </p>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="applyOption"
                  checked={showConfirmDialog.keepData}
                  onChange={() => setShowConfirmDialog(prev => prev && { ...prev, keepData: true })}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Keep my existing data</div>
                  <div className="text-gray-600 text-xs">Only update the theme and structure</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="applyOption"
                  checked={!showConfirmDialog.keepData}
                  onChange={() => setShowConfirmDialog(prev => prev && { ...prev, keepData: false })}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Use template sample data</div>
                  <div className="text-gray-600 text-xs">Replace my content with template examples</div>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmApplyTemplate}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};