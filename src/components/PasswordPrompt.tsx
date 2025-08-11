'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface PasswordPromptProps {
  onPasswordSubmit: (password: string) => void;
  error?: string;
  isVerifying?: boolean;
  workspaceName?: string;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({
  onPasswordSubmit,
  error,
  isVerifying,
  workspaceName
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onPasswordSubmit(password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Password Required
          </h1>
          <p className="text-gray-600">
            {workspaceName 
              ? `Enter the password to view "${workspaceName}"`
              : "Enter the password to view this CV"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`w-full text-center ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isVerifying}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!password.trim() || isVerifying}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Access CV'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Don&apos;t have the password? Contact the CV owner for access.
          </p>
        </div>
      </Card>
    </div>
  );
};