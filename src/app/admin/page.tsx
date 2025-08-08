'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function AdminDashboard() {
  const { userId } = useAuth();
  const cvData = useQuery(api.cv.getAllCVData, userId ? { userId } : 'skip');

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in with an authorized account to access the admin panel.</p>
          <Button as={Link} href="/sign-in" variant="primary" size="lg">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const getCompletionStatus = () => {
    if (!cvData) return { completed: 0, total: 6, percentage: 0 };
    
    let completed = 0;
    const total = 6;
    
    if (cvData.contactInfo) completed++;
    if (cvData.experiences.length > 0) completed++;
    if (cvData.skills.length > 0) completed++;
    if (cvData.projects.length > 0) completed++;
    if (cvData.education.length > 0) completed++;
    if (cvData.contactInfo?.summary) completed++;
    
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const completion = getCompletionStatus();

  const quickActions = [
    {
      title: 'Add Work Experience',
      description: 'Add your latest job position',
      href: '/admin/experience',
      icon: '💼',
      color: 'blue'
    },
    {
      title: 'Update Skills',
      description: 'Add new technologies you\'ve learned',
      href: '/admin/skills',
      icon: '⚡',
      color: 'green'
    },
    {
      title: 'AI Analysis',
      description: 'Get AI-powered CV insights',
      href: '/admin/ai-analysis',
      icon: '🤖',
      color: 'purple'
    },
    {
      title: 'Export PDF',
      description: 'Download your CV as PDF',
      href: '/',
      icon: '📄',
      color: 'orange'
    }
  ];

  const sections = [
    {
      name: 'Contact Information',
      href: '/admin/contact',
      icon: '👤',
      status: cvData?.contactInfo ? 'complete' : 'incomplete',
      count: cvData?.contactInfo ? 1 : 0
    },
    {
      name: 'Work Experience',
      href: '/admin/experience',
      icon: '💼',
      status: cvData?.experiences.length ? 'complete' : 'incomplete',
      count: cvData?.experiences.length || 0
    },
    {
      name: 'Skills',
      href: '/admin/skills',
      icon: '⚡',
      status: cvData?.skills.length ? 'complete' : 'incomplete',
      count: cvData?.skills.length || 0
    },
    {
      name: 'Projects',
      href: '/admin/projects',
      icon: '🚀',
      status: cvData?.projects.length ? 'complete' : 'incomplete',
      count: cvData?.projects.length || 0
    },
    {
      name: 'Education',
      href: '/admin/education',
      icon: '🎓',
      status: cvData?.education.length ? 'complete' : 'incomplete',
      count: cvData?.education.length || 0
    },
    {
      name: 'AI Analysis',
      href: '/admin/ai-analysis',
      icon: '🤖',
      status: 'available',
      count: null
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
              <p className="text-blue-100 text-lg">
                {cvData?.contactInfo?.name || 'Let\'s build your perfect CV'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-1">{completion.percentage}%</div>
              <div className="text-blue-100 text-sm">CV Complete</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-blue-100 mb-2">
              <span>Progress</span>
              <span>{completion.completed} of {completion.total} sections</span>
            </div>
            <div className="w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card hover className="text-center group cursor-pointer h-full">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* CV Sections Overview */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">CV Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <Link key={section.name} href={section.href}>
                <Card hover className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
                        {section.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{section.name}</h3>
                        {section.count !== null && (
                          <p className="text-sm text-gray-500">
                            {section.count} {section.count === 1 ? 'item' : 'items'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`
                      w-3 h-3 rounded-full
                      ${section.status === 'complete' ? 'bg-green-500' : 
                        section.status === 'incomplete' ? 'bg-red-500' : 'bg-blue-500'}
                    `} />
                  </div>
                  <div className={`
                    text-xs font-medium px-3 py-1 rounded-full inline-block
                    ${section.status === 'complete' ? 'bg-green-100 text-green-800' : 
                      section.status === 'incomplete' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                  `}>
                    {section.status === 'complete' ? 'Complete' : 
                     section.status === 'incomplete' ? 'Needs Content' : 'Ready to Use'}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity or Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Quick Tips</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <p className="text-sm text-gray-600">Keep your experience descriptions focused on quantifiable achievements</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <p className="text-sm text-gray-600">Use action verbs to start each bullet point in your experience section</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <p className="text-sm text-gray-600">Regularly update your skills section with new technologies</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Next Steps</h3>
            <div className="space-y-3">
              {completion.percentage < 100 ? (
                <div className="text-sm text-gray-600">
                  Complete all sections to unlock the full potential of your CV.
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Your CV is complete! Consider using AI analysis for optimization tips.
                </div>
              )}
              <div className="pt-4">
                <Button 
                  as={Link} 
                  href={completion.percentage < 50 ? '/admin/contact' : '/admin/ai-analysis'}
                  variant="primary"
                  size="sm"
                >
                  {completion.percentage < 50 ? 'Complete Your Profile' : 'Get AI Insights'}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ System Info</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Private CV management system</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Invitation-only access via Clerk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>AI-powered optimization</span>
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t">
                Add users through the Clerk dashboard to grant admin access.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}