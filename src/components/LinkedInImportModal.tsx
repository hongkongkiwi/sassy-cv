'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface LinkedInData {
  profileData: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    summary?: string;
    location?: string;
    industry?: string;
    profileUrl?: string;
  };
  experiences: Array<{
    title: string;
    companyName: string;
    companyUrl?: string;
    startDate: { month?: number; year: number };
    endDate?: { month?: number; year: number };
    description?: string;
    location?: string;
  }>;
  education: Array<{
    schoolName: string;
    degreeName?: string;
    fieldOfStudy?: string;
    startDate?: { year: number };
    endDate?: { year: number };
    description?: string;
  }>;
  skills: string[];
}

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [linkedInData, setLinkedInData] = useState<LinkedInData>({
    profileData: {},
    experiences: [],
    education: [],
    skills: [],
  });
  const [applyingSections, setApplyingSections] = useState({
    contact: true,
    experience: true,
    education: true,
    skills: true,
  });
  const [importing, setImporting] = useState(false);

  const storeImportData = useMutation(api.linkedinImport.storeImportData);
  const applyImportToCV = useMutation(api.linkedinImport.applyImportToCV);

  if (!isOpen) return null;

  const handleInputChange = (section: keyof LinkedInData, field: string, value: any) => {
    if (section === 'profileData') {
      setLinkedInData(prev => ({
        ...prev,
        profileData: { ...prev.profileData, [field]: value }
      }));
    }
  };

  const addExperience = () => {
    setLinkedInData(prev => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          title: '',
          companyName: '',
          startDate: { year: new Date().getFullYear() },
          location: '',
          description: '',
        }
      ]
    }));
  };

  const updateExperience = (index: number, field: string, value: any) => {
    setLinkedInData(prev => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setLinkedInData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setLinkedInData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          schoolName: '',
          degreeName: '',
          fieldOfStudy: '',
          startDate: { year: new Date().getFullYear() },
          endDate: { year: new Date().getFullYear() },
        }
      ]
    }));
  };

  const updateEducation = (index: number, field: string, value: any) => {
    setLinkedInData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setLinkedInData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleSkillsChange = (skills: string) => {
    const skillsArray = skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
    
    setLinkedInData(prev => ({ ...prev, skills: skillsArray }));
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Store import data
      const importId = await storeImportData({
        userId,
        profileData: linkedInData.profileData,
        experiences: linkedInData.experiences.length > 0 ? linkedInData.experiences : undefined,
        education: linkedInData.education.length > 0 ? linkedInData.education : undefined,
        skills: linkedInData.skills.length > 0 ? linkedInData.skills : undefined,
        status: 'success',
      });

      // Apply to CV sections
      await applyImportToCV({
        userId,
        importId,
        sections: applyingSections,
      });

      alert('Successfully imported LinkedIn data!');
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Profile Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={linkedInData.profileData.firstName || ''}
                onChange={(e) => handleInputChange('profileData', 'firstName', e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={linkedInData.profileData.lastName || ''}
                onChange={(e) => handleInputChange('profileData', 'lastName', e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="Professional Headline"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={linkedInData.profileData.headline || ''}
              onChange={(e) => handleInputChange('profileData', 'headline', e.target.value)}
            />
            <textarea
              placeholder="Professional Summary"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={linkedInData.profileData.summary || ''}
              onChange={(e) => handleInputChange('profileData', 'summary', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Location"
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={linkedInData.profileData.location || ''}
                onChange={(e) => handleInputChange('profileData', 'location', e.target.value)}
              />
              <input
                type="text"
                placeholder="Industry"
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={linkedInData.profileData.industry || ''}
                onChange={(e) => handleInputChange('profileData', 'industry', e.target.value)}
              />
            </div>
            <input
              type="url"
              placeholder="LinkedIn Profile URL"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={linkedInData.profileData.profileUrl || ''}
              onChange={(e) => handleInputChange('profileData', 'profileUrl', e.target.value)}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Work Experience</h3>
              <Button onClick={addExperience} size="sm">Add Experience</Button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {linkedInData.experiences.map((exp, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Experience #{index + 1}</h4>
                    <Button 
                      onClick={() => removeExperience(index)} 
                      variant="secondary" 
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Job Title"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={exp.title}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={exp.companyName}
                      onChange={(e) => updateExperience(index, 'companyName', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    <input
                      type="number"
                      placeholder="Start Year"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={exp.startDate.year}
                      onChange={(e) => updateExperience(index, 'startDate', {
                        ...exp.startDate,
                        year: parseInt(e.target.value) || new Date().getFullYear()
                      })}
                    />
                    <input
                      type="number"
                      placeholder="Start Month"
                      min="1"
                      max="12"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={exp.startDate.month || ''}
                      onChange={(e) => updateExperience(index, 'startDate', {
                        ...exp.startDate,
                        month: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                    <input
                      type="number"
                      placeholder="End Year"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={exp.endDate?.year || ''}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value ? {
                        year: parseInt(e.target.value),
                        month: exp.endDate?.month
                      } : undefined)}
                    />
                    <input
                      type="number"
                      placeholder="End Month"
                      min="1"
                      max="12"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={exp.endDate?.month || ''}
                      onChange={(e) => updateExperience(index, 'endDate', {
                        year: exp.endDate?.year || new Date().getFullYear(),
                        month: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Location"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-4"
                    value={exp.location || ''}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                  />
                  <textarea
                    placeholder="Job Description"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-4"
                    value={exp.description || ''}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  />
                </Card>
              ))}
              {linkedInData.experiences.length === 0 && (
                <p className="text-gray-500 text-center py-8">No experiences added yet.</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Education</h3>
              <Button onClick={addEducation} size="sm">Add Education</Button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {linkedInData.education.map((edu, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Education #{index + 1}</h4>
                    <Button 
                      onClick={() => removeEducation(index)} 
                      variant="secondary" 
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                  <input
                    type="text"
                    placeholder="School/University Name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                    value={edu.schoolName}
                    onChange={(e) => updateEducation(index, 'schoolName', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Degree"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={edu.degreeName || ''}
                      onChange={(e) => updateEducation(index, 'degreeName', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Field of Study"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={edu.fieldOfStudy || ''}
                      onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <input
                      type="number"
                      placeholder="Start Year"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={edu.startDate?.year || ''}
                      onChange={(e) => updateEducation(index, 'startDate', e.target.value ? {
                        year: parseInt(e.target.value)
                      } : undefined)}
                    />
                    <input
                      type="number"
                      placeholder="End Year"
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      value={edu.endDate?.year || ''}
                      onChange={(e) => updateEducation(index, 'endDate', e.target.value ? {
                        year: parseInt(e.target.value)
                      } : undefined)}
                    />
                  </div>
                </Card>
              ))}
              {linkedInData.education.length === 0 && (
                <p className="text-gray-500 text-center py-8">No education added yet.</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Skills</h3>
            <textarea
              placeholder="Enter your skills separated by commas (e.g., JavaScript, React, Node.js, Python)"
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={linkedInData.skills.join(', ')}
              onChange={(e) => handleSkillsChange(e.target.value)}
            />
            <div className="text-sm text-gray-600">
              <p>Skills will be grouped under &quot;LinkedIn Skills&quot; in your CV.</p>
              <p>Preview: {linkedInData.skills.length} skills</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review & Apply</h3>
            
            <div className="space-y-4">
              <h4 className="font-medium">Choose sections to apply to your CV:</h4>
              
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={applyingSections.contact}
                    onChange={(e) => setApplyingSections(prev => ({ ...prev, contact: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Contact Information ({Object.keys(linkedInData.profileData).length} fields)</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={applyingSections.experience}
                    onChange={(e) => setApplyingSections(prev => ({ ...prev, experience: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Work Experience ({linkedInData.experiences.length} positions)</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={applyingSections.education}
                    onChange={(e) => setApplyingSections(prev => ({ ...prev, education: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Education ({linkedInData.education.length} entries)</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={applyingSections.skills}
                    onChange={(e) => setApplyingSections(prev => ({ ...prev, skills: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Skills ({linkedInData.skills.length} skills)</span>
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-500 text-xl">⚠️</div>
                <div className="text-sm text-yellow-800">
                  <strong>Important:</strong> This will add new entries to your CV. Existing data won&#39;t be overwritten, but you may need to organize and review the imported content.
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Import from LinkedIn</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : step < currentStep 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 5 && <div className="w-8 h-0.5 bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Step {currentStep} of 5: {
              ['Profile', 'Experience', 'Education', 'Skills', 'Review'][currentStep - 1]
            }
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t">
          <Button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            variant="secondary"
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            
            {currentStep === 5 ? (
              <Button
                onClick={handleImport}
                disabled={importing}
                className="bg-[#0077B5] hover:bg-[#005885] text-white"
              >
                {importing ? 'Importing...' : 'Import Data'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};