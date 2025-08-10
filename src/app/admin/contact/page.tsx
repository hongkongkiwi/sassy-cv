'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { AIRewriteModal } from '@/components/ai/AIRewriteModal';

export default function ContactPage() {
  const { userId } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    summary: '',
  });
  const [showAIModal, setShowAIModal] = useState(false);

  const contactInfo = useQuery(api.cv.getContactInfo, {});
  const upsertContactInfo = useMutation(api.cv.upsertContactInfo);

  useEffect(() => {
    if (contactInfo) {
      setFormData({
        name: contactInfo.name || '',
        title: contactInfo.title || '',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        location: contactInfo.location || '',
        linkedin: contactInfo.linkedin || '',
        github: contactInfo.github || '',
        website: contactInfo.website || '',
        summary: contactInfo.summary || '',
      });
    }
  }, [contactInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      await upsertContactInfo({
        ...formData,
        phone: formData.phone || undefined,
        linkedin: formData.linkedin || undefined,
        github: formData.github || undefined,
        website: formData.website || undefined,
      });
      alert('Contact information saved successfully!');
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('Error saving contact information');
    }
  };

  if (!userId) return <div>Please sign in</div>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact Information</h1>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Professional Summary *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  disabled={!formData.summary}
                >
                  ✨ Improve with AI
                </button>
              </div>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full border rounded-md px-3 py-2 h-32"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Save Contact Information
            </button>
          </form>
        </div>

        {/* AI Rewrite Modal */}
        <AIRewriteModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          section="summary"
          originalContent={formData.summary}
          onRewrite={(rewrittenContent) => {
            setFormData({ ...formData, summary: rewrittenContent });
          }}
        />
      </div>
    </AdminLayout>
  );
}