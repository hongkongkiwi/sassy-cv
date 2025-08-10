import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { LanguageModelV2 } from '@ai-sdk/provider';

export type AIProvider = 'openai' | 'google';

export function getAIModel(provider: AIProvider): LanguageModelV2 {
  switch (provider) {
    case 'google':
      return google('gemini-1.5-flash');
    case 'openai':
    default:
      return openai('gpt-4o-mini');
  }
}

export const DEFAULT_PROVIDER: AIProvider = 'openai';

export const getDefaultProvider = () => DEFAULT_PROVIDER;

export const availableProviders = [
  { id: 'openai', name: 'OpenAI GPT-4', description: 'Advanced language model' },
  { id: 'google', name: 'Google Gemini', description: 'Google\'s AI model' }
] as const;