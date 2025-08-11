'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { AIRewriteModal } from '@/components/ai/AIRewriteModal';
import { Id } from '../../../../convex/_generated/dataModel';

interface ExperienceFormData {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string[];
  technologies: string[];
}

const initialFormData: ExperienceFormData = {
  company: '',
  position: '',
  startDate: '',
  endDate: '',
  location: '',
  description: [''],
  technologies: [],
};

export default function ExperiencePage() {
  const { userId } = useAuth();
  const [isEditing, setIsEditing] = useState<Id<'experiences'> | null>(null);
  const [formData, setFormData] = useState<ExperienceFormData>(initialFormData);
  const [techInput, setTechInput] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);

  // Get the first workspace for the user
  const cvData = useQuery(api.cv.getAllCVData, userId ? {} : 'skip');
  const workspaceId = cvData?.contactInfo?.workspaceId;

  const experiences = useQuery(api.cv.getExperiences, workspaceId ? { workspaceId } : 'skip');
  const createExperience = useMutation(api.cv.createExperience);
  const updateExperience = useMutation(api.cv.updateExperience);
  const deleteExperience = useMutation(api.cv.deleteExperience);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !workspaceId) return;

    const experienceData = {
      ...formData,
      endDate: formData.endDate || undefined,
      technologies: formData.technologies.length > 0 ? formData.technologies : undefined,
      order: experiences?.length || 0,
    };

    try {
      if (isEditing !== null) {
        await updateExperience({
          id: isEditing as Id<'experiences'>,
          ...experienceData,
        });
      } else {
        await createExperience({
          workspaceId,
          ...experienceData,
        });
      }
      
      setFormData(initialFormData);
      setIsEditing(null);
      setTechInput('');
    } catch (error) {
      console.error('Error saving experience:', error);
    }
  };

  const handleEdit = (exp: { _id: Id<'experiences'>; company: string; position: string; startDate: string; endDate?: string; location: string; description: string[]; technologies?: string[] }) => {
    setFormData({
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate || '',
      location: exp.location,
      description: exp.description,
      technologies: exp.technologies || [],
    });
    setIsEditing(exp._id as Id<'experiences'>);
  };

  const handleDelete = async (id: Id<'experiences'>) => {
    if (confirm('Are you sure you want to delete this experience?')) {
      await deleteExperience({ id });
    }
  };

  const addDescription = () => {
    setFormData({
      ...formData,
      description: [...formData.description, ''],
    });
  };

  const updateDescription = (index: number, value: string) => {
    const newDescription = [...formData.description];
    newDescription[index] = value;
    setFormData({ ...formData, description: newDescription });
  };

  const removeDescription = (index: number) => {
    setFormData({
      ...formData,
      description: formData.description.filter((_, i) => i !== index),
    });
  };

  const addTechnology = () => {
    if (techInput.trim()) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, techInput.trim()],
      });
      setTechInput('');
    }
  };

  const removeTechnology = (index: number) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter((_, i) => i !== index),
    });
  };

  if (!userId) return <div>Please sign in</div>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Work Experience</h1>
        </div>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {isEditing ? 'Edit Experience' : 'Add New Experience'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="month"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (leave empty for current)
                </label>
                <input
                  type="month"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Job Description
                </label>
                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  disabled={formData.description.length === 0 || formData.description.every(d => !d.trim())}
                >
                  ✨ Improve with AI
                </button>
              </div>
              {formData.description.map((desc: string, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={desc}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    className="flex-1 border rounded-md px-3 py-2"
                    placeholder="Job responsibility or achievement"
                  />
                  <button
                    type="button"
                    onClick={() => removeDescription(index)}
                    className="text-red-600 hover:text-red-800 px-3 py-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDescription}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Description Point
              </button>
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technologies
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2"
                  placeholder="Add technology"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                />
                <button
                  type="button"
                  onClick={addTechnology}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.technologies.map((tech: string, index: number) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(index)}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {isEditing ? 'Update Experience' : 'Add Experience'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(null);
                    setFormData(initialFormData);
                    setTechInput('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Experience List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Your Experience</h2>
          </div>
          
          <div className="divide-y">
            {experiences?.map((exp) => (
              <div key={exp._id} className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{exp.position}</h3>
                    <p className="text-blue-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.endDate || 'Present'} • {exp.location}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(exp)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <ul className="list-disc list-inside text-gray-700 mb-3">
                  {exp.description.map((desc: string, index: number) => (
                    <li key={index}>{desc}</li>
                  ))}
                </ul>
                
                {exp.technologies && (
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map((tech: string, index: number) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Rewrite Modal */}
        <AIRewriteModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          section="experience"
          originalContent={formData.description.filter(d => d.trim())}
          onRewrite={(rewrittenContent) => {
            // Split the rewritten content back into bullet points
            const newDescriptions = rewrittenContent
              .split(/\n[•\-*]\s*/)
              .map(item => item.replace(/^[•\-*]\s*/, '').trim())
              .filter(item => item.length > 0);
            
            setFormData({ 
              ...formData, 
              description: newDescriptions.length > 0 ? newDescriptions : [rewrittenContent]
            });
          }}
        />
      </div>
    </AdminLayout>
  );
}