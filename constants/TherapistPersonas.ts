
export const DEFAULT_PERSONA_ID = 'default';

export const THERAPIST_PERSONAS = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard therapeutic approach',
    avatar: require('../assets/images/final_quest_240x240.png'),
  },
];

export function getPersonaById(id: string) {
  return THERAPIST_PERSONAS.find(p => p.id === id) || THERAPIST_PERSONAS[0];
}

export function getPreviewContentById(id: string) {
  return {
    userMessage: 'Hello',
    aiResponse: 'Hi there! How can I help you today?',
  };
}
