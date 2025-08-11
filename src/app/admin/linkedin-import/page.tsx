'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LinkedInImportModal } from '@/components/LinkedInImportModal';

export default function LinkedInImportPage() {
  const { userId } = useAuth();
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Get the first workspace for the user
  const cvData = useQuery(api.cv.getAllCVData, userId ? {} : 'skip');
  const workspaceId = cvData?.contactInfo?.workspaceId;

  const importHistory = useQuery(api.linkedinImport.getImportHistory, 
    workspaceId ? { workspaceId } : 'skip'
  ) || [];
  
  const latestImport = useQuery(api.linkedinImport.getLatestImport,
    workspaceId ? { workspaceId } : 'skip'
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!userId) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">LinkedIn Import</h1>
          <p className="text-gray-600">Please sign in to import from LinkedIn.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LinkedIn Import</h1>
            <p className="text-gray-600 mt-2">
              Import your professional data from LinkedIn to save time building your CV
            </p>
          </div>
          <Button 
            onClick={() => setShowImportModal(true)}
            className="bg-[#0077B5] hover:bg-[#005885] text-white"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Import from LinkedIn
          </Button>
        </div>

        {/* Instructions Card */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="text-4xl">📋</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Import from LinkedIn</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Since LinkedIn doesn&#39;t provide a public API for personal data, you&#39;ll need to manually export your data:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to your LinkedIn profile and copy the URL</li>
                  <li>Copy your headline, summary, and other profile information</li>
                  <li>Copy job experiences, education, and skills</li>
                  <li>Use our import tool to paste and organize this data</li>
                </ol>
                <p className="text-xs text-gray-500 mt-3">
                  <strong>Note:</strong> This is a manual process to ensure your data remains private and secure.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Latest Import Status */}
        {latestImport && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">📊</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Latest Import</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(latestImport.importedAt)}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(latestImport.status)}`}>
                {latestImport.status}
              </span>
            </div>
            
            {latestImport.profileData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Profile Data</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {latestImport.profileData.firstName && (
                    <p><strong>Name:</strong> {latestImport.profileData.firstName} {latestImport.profileData.lastName}</p>
                  )}
                  {latestImport.profileData.headline && (
                    <p><strong>Headline:</strong> {latestImport.profileData.headline}</p>
                  )}
                  {latestImport.profileData.location && (
                    <p><strong>Location:</strong> {latestImport.profileData.location}</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Import History */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Import History</h3>
          
          {importHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📥</div>
              <h4 className="font-medium text-gray-900 mb-2">No imports yet</h4>
              <p className="text-gray-600 mb-4">
                Start by importing your LinkedIn profile data to quickly populate your CV.
              </p>
              <Button onClick={() => setShowImportModal(true)}>
                Import from LinkedIn
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {importHistory.map((importItem) => (
                <div 
                  key={importItem._id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {importItem.status === 'success' ? '✅' : 
                       importItem.status === 'partial' ? '⚠️' : '❌'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDate(importItem.importedAt)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {importItem.experiences?.length || 0} experiences • {' '}
                        {importItem.education?.length || 0} education • {' '}
                        {importItem.skills?.length || 0} skills
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(importItem.status)}`}>
                    {importItem.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Benefits</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Save hours of manual data entry
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Maintain consistency across platforms
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Keep your CV up-to-date with LinkedIn changes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Professional formatting and structure
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Privacy</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">🛡️</span>
                No automatic LinkedIn API access
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">🛡️</span>
                You control what data is imported
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">🛡️</span>
                Data stored securely in your account
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">🛡️</span>
                No third-party data sharing
              </li>
            </ul>
          </Card>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <LinkedInImportModal 
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            workspaceId={workspaceId!}
          />
        )}
      </div>
    </AdminLayout>
  );
}