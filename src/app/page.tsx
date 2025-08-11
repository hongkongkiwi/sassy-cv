'use client';

import React, { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { env } from '@/env';

import { api } from '../../convex/_generated/api';
import { cvData } from '@/data/cv-data';
import { ContactInfo } from '@/components/ContactInfo';
import { CVSection } from '@/components/CVSection';
import { ExperienceSection } from '@/components/ExperienceSection';
import { SkillsSection } from '@/components/SkillsSection';
import { ProjectsSection } from '@/components/ProjectsSection';
import { EducationSection } from '@/components/EducationSection';
import { CVData } from '@/types/cv';

export default function Home() {
  const { userId } = useAuth();
  const cvDataFromDB = useQuery(api.cv.getAllCVData, {});
  const trackEvent = useMutation(api.analytics.trackEvent);

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      // Get workspace ID from the contact info
      const workspaceId = cvDataFromDB?.contactInfo?.workspaceId;
      if (!workspaceId) return; // Cannot track without workspace
      
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
          workspaceId,
          event: 'view',
          visitorId,
          userAgent: navigator.userAgent,
          deviceType: getDeviceType(),
          referrer: document.referrer || undefined,
        });
      } catch (error) {
        console.log('Analytics tracking failed:', error);
      }
    };

    trackPageView();
  }, [trackEvent, userId, cvDataFromDB?.contactInfo?.workspaceId]);

  // Transform Convex data to match CVData interface
  const transformedCVData: CVData | null = cvDataFromDB ? {
    contact: cvDataFromDB.contactInfo ? {
      name: cvDataFromDB.contactInfo.name,
      title: cvDataFromDB.contactInfo.title,
      email: cvDataFromDB.contactInfo.email,
      phone: cvDataFromDB.contactInfo.phone,
      location: cvDataFromDB.contactInfo.location,
      linkedin: cvDataFromDB.contactInfo.linkedin,
      github: cvDataFromDB.contactInfo.github,
      website: cvDataFromDB.contactInfo.website,
    } : cvData.contact,
    summary: cvDataFromDB.contactInfo?.summary || cvData.summary,
    experience: cvDataFromDB.experiences.map((exp, index) => ({
      id: exp._id,
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate || undefined,
      location: exp.location,
      description: exp.description,
      technologies: exp.technologies,
    })),
    skills: cvDataFromDB.skills.map(skill => ({
      category: skill.category,
      items: skill.items,
    })),
    projects: cvDataFromDB.projects.map(project => ({
      id: project._id,
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      url: project.url,
      github: project.github,
    })),
    education: cvDataFromDB.education.map(edu => ({
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

  // Use database data if available, otherwise fallback to static data
  const currentCVData = transformedCVData || cvData;

  const handleExportPDF = async () => {
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
      const workspaceId = cvDataFromDB?.contactInfo?.workspaceId;
      if (!workspaceId) return; // Cannot track without workspace
      let visitorId = localStorage.getItem('cv-visitor-id');
      if (!visitorId) {
        visitorId = Math.random().toString(36).substr(2, 9);
        localStorage.setItem('cv-visitor-id', visitorId);
      }
      
      try {
        await trackEvent({
          workspaceId,
          event: 'download',
          visitorId,
          userAgent: navigator.userAgent,
          metadata: { filename: `${currentCVData.contact.name.replace(/\s+/g, '_')}_CV.pdf` },
        });
      } catch (error) {
        console.log('Download tracking failed:', error);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

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
              {userId ? (
                <Link
                  href="/admin"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                >
                  <span>⚙️</span>
                  Admin
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                >
                  <span>🔐</span>
                  Sign In
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
            Generated with CV Builder • Last updated {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </main>
  );
}