import React from 'react';
import { ContactInfo as ContactInfoType } from '@/types/cv';

interface ContactInfoProps {
  contact: ContactInfoType;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ contact }) => {
  return (
    <div className="text-center">
      <div className="mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
          {contact.name}
        </h1>
        <h2 className="text-2xl font-medium text-blue-600 mb-4">{contact.title}</h2>
      </div>
      
      <div className="flex flex-wrap justify-center gap-6 text-gray-600">
        <a 
          href={`mailto:${contact.email}`} 
          className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200 group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
            <span className="text-lg">📧</span>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</div>
            <div className="font-medium">{contact.email}</div>
          </div>
        </a>
        
        {contact.phone && (
          <a 
            href={`tel:${contact.phone}`} 
            className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200 group"
          >
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200">
              <span className="text-lg">📱</span>
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</div>
              <div className="font-medium">{contact.phone}</div>
            </div>
          </a>
        )}
        
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
            <span className="text-lg">📍</span>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Location</div>
            <div className="font-medium">{contact.location}</div>
          </div>
        </div>
        
        {contact.linkedin && (
          <a 
            href={contact.linkedin} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200 group"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
              <span className="text-lg">💼</span>
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">LinkedIn</div>
              <div className="font-medium">View Profile</div>
            </div>
          </a>
        )}
        
        {contact.github && (
          <a 
            href={contact.github} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200 group"
          >
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-gray-100 transition-colors duration-200">
              <span className="text-lg">⚡</span>
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">GitHub</div>
              <div className="font-medium">View Repos</div>
            </div>
          </a>
        )}
        
        {contact.website && (
          <a 
            href={contact.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200 group"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors duration-200">
              <span className="text-lg">🌐</span>
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Website</div>
              <div className="font-medium">Visit Site</div>
            </div>
          </a>
        )}
      </div>
    </div>
  );
};