'use client';

import React, { useState } from 'react';
import { AIProviderSelector } from './AIProviderSelector';
import { AIProvider, getDefaultProvider } from '@/lib/ai-providers';
import { CVData } from '@/types/cv';

interface CVAnalysisProps {
  cvData: CVData;
}

interface AnalysisResult {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missingElements: string[];
  industryAlignment: {
    score: number;
    feedback: string;
  };
  keywordOptimization: {
    score: number;
    suggestions: string[];
  };
  sections: {
    summary: { score: number; feedback: string };
    experience: { score: number; feedback: string };
    skills: { score: number; feedback: string };
    projects: { score: number; feedback: string };
    education: { score: number; feedback: string };
  };
}

export const CVAnalysis: React.FC<CVAnalysisProps> = ({ cvData }) => {
  const [provider, setProvider] = useState<AIProvider>(getDefaultProvider());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvData,
          provider
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze CV');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing CV:', error);
      alert('Failed to analyze CV. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const ScoreBar = ({ score }: { score: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
      <div 
        className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">AI CV Analysis</h2>
        
        <div className="flex items-end gap-4 mb-4">
          <AIProviderSelector
            selectedProvider={provider}
            onProviderChange={setProvider}
            className="flex-1 max-w-xs"
          />
          
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Analyzing...
              </>
            ) : (
              <>
                🔍 Analyze CV
              </>
            )}
          </button>
        </div>

        {analysis && (
          <div className="space-y-6 mt-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Overall Score</h3>
                <span className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}/100
                </span>
              </div>
              <ScoreBar score={analysis.overallScore} />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center justify-between">
                  Industry Alignment
                  <span className={`px-2 py-1 rounded text-sm ${getScoreColor(analysis.industryAlignment.score)}`}>
                    {analysis.industryAlignment.score}%
                  </span>
                </h4>
                <p className="text-sm text-gray-600">{analysis.industryAlignment.feedback}</p>
                <ScoreBar score={analysis.industryAlignment.score} />
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center justify-between">
                  Keyword Optimization
                  <span className={`px-2 py-1 rounded text-sm ${getScoreColor(analysis.keywordOptimization.score)}`}>
                    {analysis.keywordOptimization.score}%
                  </span>
                </h4>
                <div className="text-sm space-y-1">
                  {analysis.keywordOptimization.suggestions.slice(0, 2).map((suggestion, index) => (
                    <p key={index} className="text-gray-600">• {suggestion}</p>
                  ))}
                </div>
                <ScoreBar score={analysis.keywordOptimization.score} />
              </div>
            </div>

            {/* Section Scores */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Section Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analysis.sections).map(([section, data]) => (
                  <div key={section} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{section}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getScoreColor(data.score)}`}>
                        {data.score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{data.feedback}</p>
                    <ScoreBar score={data.score} />
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  ✅ Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  🔧 Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Elements */}
            {analysis.missingElements.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                  ⚠️ Missing Elements
                </h3>
                <ul className="space-y-2">
                  {analysis.missingElements.map((element, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {element}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};