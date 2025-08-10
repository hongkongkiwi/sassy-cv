'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: '📊',
    description: 'Overview and quick actions'
  },
  { 
    name: 'Contact Info', 
    href: '/admin/contact', 
    icon: '👤',
    description: 'Personal details and summary'
  },
  { 
    name: 'Experience', 
    href: '/admin/experience', 
    icon: '💼',
    description: 'Work history and positions'
  },
  { 
    name: 'Skills', 
    href: '/admin/skills', 
    icon: '⚡',
    description: 'Technical and soft skills'
  },
  { 
    name: 'Projects', 
    href: '/admin/projects', 
    icon: '🚀',
    description: 'Portfolio and side projects'
  },
  { 
    name: 'Education', 
    href: '/admin/education', 
    icon: '🎓',
    description: 'Academic background'
  },
  { 
    name: 'AI Analysis', 
    href: '/admin/ai-analysis', 
    icon: '🤖',
    description: 'AI-powered CV insights'
  },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: '📊',
    description: 'Track CV performance'
  },
  { 
    name: 'Themes', 
    href: '/admin/themes', 
    icon: '🎨',
    description: 'Customize appearance'
  },
  { 
    name: 'LinkedIn Import', 
    href: '/admin/linkedin-import', 
    icon: '📥',
    description: 'Import from LinkedIn profile'
  },
  { 
    name: 'Cover Letters', 
    href: '/admin/cover-letters', 
    icon: '📝',
    description: 'AI-powered cover letters'
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center h-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-sm font-bold">
                CV
              </div>
              <div>
                <h1 className="text-lg font-semibold">CV Builder</h1>
                <p className="text-xs text-blue-100">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="text-lg mr-3 transition-transform group-hover:scale-110">
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              aria-label="View Public CV"
            >
              <span className="text-lg" aria-hidden>👁️</span>
              <span>View Public CV</span>
            </Link>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-700">Authorized User</div>
                  <div className="text-xs text-gray-500">Admin Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">CV Builder</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};