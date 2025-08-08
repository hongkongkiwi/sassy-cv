import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  resize?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helpText,
  resize = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 
          placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          transition-colors duration-200
          ${!resize ? 'resize-none' : ''}
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};