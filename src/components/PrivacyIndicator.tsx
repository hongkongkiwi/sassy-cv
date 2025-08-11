'use client';

import React from 'react';
import { getPrivacyLevelDescription, getPrivacyLevelIcon, PrivacyLevel } from '@/lib/privacy';

interface PrivacyIndicatorProps {
  level: PrivacyLevel;
  className?: string;
  showLabel?: boolean;
  showTooltip?: boolean;
}

export const PrivacyIndicator: React.FC<PrivacyIndicatorProps> = ({
  level,
  className = '',
  showLabel = true,
  showTooltip = true,
}) => {
  const icon = getPrivacyLevelIcon(level);
  const description = getPrivacyLevelDescription(level);
  
  const getColorClasses = () => {
    switch (level) {
      case 'public':
        return 'text-green-600 bg-green-100';
      case 'secret_link':
        return 'text-blue-600 bg-blue-100';
      case 'password':
        return 'text-yellow-600 bg-yellow-100';
      case 'private':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelName = () => {
    switch (level) {
      case 'public':
        return 'Public';
      case 'secret_link':
        return 'Secret Link';
      case 'password':
        return 'Password Protected';
      case 'private':
        return 'Private';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-medium ${getColorClasses()} ${className}`}
      title={showTooltip ? description : undefined}
    >
      <span role="img" aria-label={getLevelName()}>
        {icon}
      </span>
      {showLabel && (
        <span>{getLevelName()}</span>
      )}
    </div>
  );
};

interface PrivacyStatusCardProps {
  level: PrivacyLevel;
  className?: string;
  children?: React.ReactNode;
}

export const PrivacyStatusCard: React.FC<PrivacyStatusCardProps> = ({
  level,
  className = '',
  children
}) => {
  const description = getPrivacyLevelDescription(level);
  
  const getBorderColor = () => {
    switch (level) {
      case 'public':
        return 'border-green-200';
      case 'secret_link':
        return 'border-blue-200';
      case 'password':
        return 'border-yellow-200';
      case 'private':
        return 'border-red-200';
      default:
        return 'border-gray-200';
    }
  };

  const getBackgroundColor = () => {
    switch (level) {
      case 'public':
        return 'bg-green-50';
      case 'secret_link':
        return 'bg-blue-50';
      case 'password':
        return 'bg-yellow-50';
      case 'private':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getBorderColor()} ${getBackgroundColor()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <PrivacyIndicator level={level} showTooltip={false} />
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {description}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
};