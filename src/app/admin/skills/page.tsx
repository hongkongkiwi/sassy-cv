'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Id } from '../../../../convex/_generated/dataModel';

export default function SkillsPage() {
  const { userId } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    items: [] as string[],
  });
  const [skillInput, setSkillInput] = useState('');
  const [isEditing, setIsEditing] = useState<Id<'skills'> | null>(null);

  // Get the first workspace for the user
  const cvData = useQuery(api.cv.getAllCVData, userId ? {} : 'skip');
  const workspaceId = cvData?.contactInfo?.workspaceId;

  const skills = useQuery(api.cv.getSkills, workspaceId ? { workspaceId } : 'skip');
  const createSkill = useMutation(api.cv.createSkill);
  const updateSkill = useMutation(api.cv.updateSkill);
  const deleteSkill = useMutation(api.cv.deleteSkill);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !workspaceId || formData.items.length === 0) return;

    try {
      if (isEditing !== null) {
        await updateSkill({
          id: isEditing as Id<'skills'>,
          category: formData.category,
          items: formData.items,
          order: skills?.length || 0,
        });
      } else {
        await createSkill({
          workspaceId,
          category: formData.category,
          items: formData.items,
          order: skills?.length || 0,
        });
      }
      
      setFormData({ category: '', items: [] });
      setIsEditing(null);
    } catch (error) {
      console.error('Error saving skill:', error);
    }
  };

  const addSkillItem = () => {
    if (skillInput.trim()) {
      setFormData({
        ...formData,
        items: [...formData.items, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const removeSkillItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleEdit = (skill: { _id: Id<'skills'>; category: string; items: string[] }) => {
    setFormData({
      category: skill.category,
      items: skill.items,
    });
    setIsEditing(skill._id as Id<'skills'>);
  };

  const handleDelete = async (id: Id<'skills'>) => {
    if (confirm('Are you sure you want to delete this skill category?')) {
      await deleteSkill({ id });
    }
  };

  if (!userId) return <div>Please sign in</div>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Skills</h1>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {isEditing ? 'Edit Skill Category' : 'Add New Skill Category'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                placeholder="e.g. Programming Languages, Frontend, Backend"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2"
                  placeholder="Add skill"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillItem())}
                />
                <button
                  type="button"
                  onClick={addSkillItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.items.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkillItem(index)}
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
                {isEditing ? 'Update Category' : 'Add Category'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(null);
                    setFormData({ category: '', items: [] });
                    setSkillInput('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Skills List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Your Skills</h2>
          </div>
          
          <div className="divide-y">
            {skills?.map((skill) => (
              <div key={skill._id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{skill.category}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(skill)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(skill._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {skill.items.map((item: string, index: number) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}