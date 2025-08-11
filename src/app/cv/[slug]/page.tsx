'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

import { api } from '../../../../convex/_generated/api';
import { PasswordPrompt } from '@/components/PasswordPrompt';
import { PrivacyIndicator } from '@/components/PrivacyIndicator';
import { ContactInfo } from '@/components/ContactInfo';
import { CVSection } from '@/components/CVSection';
import { ExperienceSection } from '@/components/ExperienceSection';
import { SkillsSection } from '@/components/SkillsSection';
import { ProjectsSection } from '@/components/ProjectsSection';
import { EducationSection } from '@/components/EducationSection';
import { CVData } from '@/types/cv';
import { PrivacyLevel } from '@/lib/privacy';

export default function CVPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  
  const slug = params?.slug as string;
  const secretToken = searchParams?.get('token') || undefined;
  
  const [password, setPassword] = useState('');
  const [accessError, setAccessError] = useState<string>('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  
  // Get workspace basic info
  const workspace = useQuery(api.workspaces.getWorkspaceBySlug, { slug });
  
  // Verify access with provided credentials
  const accessResult = useQuery(
    api.workspaces.verifyWorkspaceAccess,
    slug ? {
      slug,
      secretToken,
      password: password || undefined,
    } : 'skip'
  );
  
  // Get CV data if access is granted
  const cvData = useQuery(
    api.cv.getAllCVData,
    accessResult?.canAccess ? {} : 'skip'
  );
  
  const trackEvent = useMutation(api.analytics.trackEvent);

  const trackPageView = useCallback(async () => {
    if (!workspace || !accessResult) return;
    
    // Generate or get visitor ID
    let visitorId = localStorage.getItem('cv-visitor-id');
    if (!visitorId) {
      visitorId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('cv-visitor-id', visitorId);
    }

    // Detect device type
    const getDeviceType = () => {
      const userAgent = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
      if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
      return 'desktop';
    };

    try {
      await trackEvent({
        workspaceId: workspace._id,
        event: 'view',
        visitorId,
        userAgent: navigator.userAgent,
        deviceType: getDeviceType(),
        referrer: document.referrer || undefined,
        collaboratorId: accessResult?.isCollaborator ? userId || undefined : undefined,
      });
    } catch (error) {
      console.log('Analytics tracking failed:', error);
    }
  }, [workspace, accessResult, trackEvent, userId]);

  // Handle access verification
  useEffect(() => {
    if (!workspace || !accessResult) return;

    if (accessResult.canAccess) {
      setShowPasswordPrompt(false);
      setAccessError('');
      // Track page view
      trackPageView();
    } else if (accessResult.reason === 'Password required') {
      setShowPasswordPrompt(true);
      setAccessError('');
    } else if (accessResult.reason === 'Incorrect password') {
      setShowPasswordPrompt(true);
      setAccessError('Incorrect password. Please try again.');
    } else {
      setShowPasswordPrompt(false);
      setAccessError(accessResult.reason || 'Access denied');
    }
  }, [workspace, accessResult, trackPageView]);

  const handlePasswordSubmit = (newPassword: string) => {
    setIsVerifyingPassword(true);
    setPassword(newPassword);
    // The useEffect will handle the verification when accessResult updates
    setTimeout(() => setIsVerifyingPassword(false), 1000);
  };

  const handleExportPDF = async () => {
    if (!currentCVData) return;
    
    try {
      // Dynamic import for better code splitting
      const [{ pdf }, { saveAs }, { PDFDocument: PDFDocumentComponent }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('file-saver'),
        import('@/components/PDFDocument')
      ]);
      const blob = await pdf(<PDFDocumentComponent data={currentCVData} />).toBlob();
      saveAs(blob, `${currentCVData.contact.name.replace(/\s+/g, '_')}_CV.pdf`);
      
      // Track download event
      let visitorId = localStorage.getItem('cv-visitor-id');
      if (!visitorId) {
        visitorId = Math.random().toString(36).substr(2, 9);
        localStorage.setItem('cv-visitor-id', visitorId);
      }
      
      try {
        await trackEvent({
          workspaceId: workspace!._id,
          event: 'download',
          visitorId,
          userAgent: navigator.userAgent,
          metadata: { filename: `${currentCVData.contact.name.replace(/\s+/g, '_')}_CV.pdf` },
          collaboratorId: accessResult?.isCollaborator ? userId || undefined : undefined,
        });
      } catch (error) {
        console.log('Download tracking failed:', error);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Loading states
  if (!workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CV...</p>
        </div>
      </div>
    );
  }

  // Show password prompt if needed
  if (showPasswordPrompt) {
    return (
      <PasswordPrompt
        onPasswordSubmit={handlePasswordSubmit}
        error={accessError}
        isVerifying={isVerifyingPassword}
        workspaceName={workspace.name}
      />
    );
  }

  // Show access denied if no access
  if (!accessResult?.canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-2xl font-bold mx-auto mb-4">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            {accessError || "You don't have permission to view this CV."}
          </p>
          {workspace.privacy.level === 'private' && (
            <Link
              href="/sign-in"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Transform CV data
  const transformedCVData: CVData | null = cvData ? {
    contact: cvData.contactInfo ? {
      name: cvData.contactInfo.name,
      title: cvData.contactInfo.title,
      email: cvData.contactInfo.email,
      phone: cvData.contactInfo.phone,
      location: cvData.contactInfo.location,
      linkedin: cvData.contactInfo.linkedin,
      github: cvData.contactInfo.github,
      website: cvData.contactInfo.website,
    } : {
      name: workspace.name,
      title: 'Professional',
      email: '',
      location: '',
    },
    summary: cvData.contactInfo?.summary || 'Professional summary not available.',
    experience: cvData.experiences.filter(exp => exp.isActive).map(exp => ({
      id: exp._id,
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate,
      location: exp.location,
      description: exp.description,
      technologies: exp.technologies,
    })),
    skills: cvData.skills.filter(skill => skill.isActive).map(skill => ({
      category: skill.category,
      items: skill.items,
    })),
    projects: cvData.projects.filter(project => project.isActive).map(project => ({
      id: project._id,
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      url: project.url,
      github: project.github,
    })),
    education: cvData.education.filter(edu => edu.isActive).map(edu => ({
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

  const currentCVData = transformedCVData;

  if (!currentCVData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CV data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                CV
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{currentCVData.contact.name}</h1>
                <p className="text-sm text-gray-600">{currentCVData.contact.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Privacy indicator */}
              <PrivacyIndicator 
                level={workspace.privacy.level as PrivacyLevel} 
                showLabel={false}
              />
              
              {/* Admin link for collaborators */}
              {accessResult?.isCollaborator && (
                <Link
                  href={`/admin`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                >
                  <span>⚙️</span>
                  Admin
                </Link>
              )}
              
              <button
                onClick={handleExportPDF}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                aria-label="Export CV to PDF"
              >
                <span aria-hidden>📄</span>
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section with Contact Info */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <ContactInfo contact={currentCVData.contact} />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <CVSection title="Professional Summary">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
              <p className="text-gray-700 leading-relaxed text-lg">{currentCVData.summary}</p>
            </div>
          </CVSection>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <CVSection title="Work Experience">
            <ExperienceSection experiences={currentCVData.experience} />
          </CVSection>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <CVSection title="Technical Skills">
            <SkillsSection skills={currentCVData.skills} />
          </CVSection>
        </div>

        {/* Projects */}
        {currentCVData.projects.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <CVSection title="Featured Projects">
              <ProjectsSection projects={currentCVData.projects} />
            </CVSection>
          </div>
        )}

        {/* Education */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <CVSection title="Education">
            <EducationSection education={currentCVData.education} />
          </CVSection>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Powered by Sassy CV • Last updated {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </main>
  );
}