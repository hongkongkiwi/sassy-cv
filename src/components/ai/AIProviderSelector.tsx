'use client';

import React from 'react';
import { availableProviders, AIProvider } from '@/lib/ai-providers';

interface AIProviderSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  className?: string;
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  className = ''
}) => {
  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        AI Provider
      </label>
      <select
        value={selectedProvider}
        onChange={(e) => onProviderChange(e.target.value as AIProvider)}
        className="w-full border rounded-md px-3 py-2 bg-white"
      >
        {availableProviders.map((provider) => (
          <option key={provider.value} value={provider.value}>
            {provider.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        {availableProviders.find(p => p.value === selectedProvider)?.description}
      </p>
    </div>
  );
};