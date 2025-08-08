'use client';

import React from 'react';
import { SignIn } from '@clerk/nextjs';
import { Card } from '@/components/ui/Card';

export const UnauthorizedAccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
          <p className="text-gray-600 mb-6">
            This is a private CV management system. Please sign in with an authorized account.
          </p>
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-900 mb-1">Need Access?</p>
            <p>Contact the site administrator to be added to the authorized users list.</p>
          </div>
        </Card>

        <Card padding="sm">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                card: "shadow-none border-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              },
            }}
            redirectUrl="/admin"
          />
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Powered by CV Builder • Secure Authentication via Clerk
          </p>
        </div>
      </div>
    </div>
  );
};