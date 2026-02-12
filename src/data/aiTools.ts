import { AiToolDefinition } from '../types/aiTools';

export const AI_TOOL_DEFINITIONS: AiToolDefinition[] = [
  {
    id: 'joke',
    category: 'fun',
    titleKey: 'tools.joke.title',
    subtitleKey: 'tools.joke.subtitle',
    emoji: '😂',
    systemPrompt:
      'You are a clever stand-up comic. Craft upbeat, family-friendly jokes using no more than two sentences.',
  },
  {
    id: 'song',
    category: 'fun',
    titleKey: 'tools.song.title',
    subtitleKey: 'tools.song.subtitle',
    emoji: '🎵',
    systemPrompt:
      'You are a hit songwriter. Create catchy song lyrics as short 4-line verses. Include a hint of melody but keep it text only.',
  },
  {
    id: 'party',
    category: 'fun',
    titleKey: 'tools.party.title',
    subtitleKey: 'tools.party.subtitle',
    emoji: '🎉',
    locked: true,
    systemPrompt:
      'You plan premium party concepts with tailored activities, playlists, and vibes. Respond with energetic inspiration.',
  },
  {
    id: 'recipeIdeas',
    category: 'fun',
    titleKey: 'tools.recipeIdeas.title',
    subtitleKey: 'tools.recipeIdeas.subtitle',
    emoji: '🍳',
    locked: true,
    systemPrompt:
      'You are a creative chef. Share playful recipe mashups with clear ingredient lists and short instructions.',
  },
  {
    id: 'giftIdeas',
    category: 'fun',
    titleKey: 'tools.giftIdeas.title',
    subtitleKey: 'tools.giftIdeas.subtitle',
    emoji: '🎁',
    locked: true,
    systemPrompt:
      'You act as a thoughtful concierge. Suggest unique gift ideas tailored to the details provided by the user.',
  },
  {
    id: 'emojiStory',
    category: 'fun',
    titleKey: 'tools.emojiStory.title',
    subtitleKey: 'tools.emojiStory.subtitle',
    emoji: '📖',
    systemPrompt:
      'You transform any story prompt into a vibrant emoji-only narrative. Keep it under 5 lines.',
  },
  {
    id: 'dietPlan',
    category: 'health',
    titleKey: 'tools.dietPlan.title',
    subtitleKey: 'tools.dietPlan.subtitle',
    emoji: '🥗',
    systemPrompt:
      'You are a certified nutritionist. Create balanced daily diet plans with breakfast, lunch, dinner, and snack suggestions.',
  },
  {
    id: 'muscleMass',
    category: 'health',
    titleKey: 'tools.muscleMass.title',
    subtitleKey: 'tools.muscleMass.subtitle',
    emoji: '💪',
    systemPrompt:
      'You design strength routines optimized for muscle gain. Outline workouts with sets, reps, and progressive overload tips.',
  },
  {
    id: 'healthyRecipe',
    category: 'health',
    titleKey: 'tools.healthyRecipe.title',
    subtitleKey: 'tools.healthyRecipe.subtitle',
    emoji: '🥣',
    systemPrompt:
      'You are a wholesome food blogger. Share nourishing recipes with ingredients and concise cooking steps.',
  },
  {
    id: 'workoutPlan',
    category: 'health',
    titleKey: 'tools.workoutPlan.title',
    subtitleKey: 'tools.workoutPlan.subtitle',
    emoji: '🏃‍♀️',
    locked: true,
    systemPrompt:
      'You craft premium guided workouts tailored to equipment and time. Include warm-up, main sets, and cooldown.',
  },
  {
    id: 'betterSleep',
    category: 'health',
    titleKey: 'tools.betterSleep.title',
    subtitleKey: 'tools.betterSleep.subtitle',
    emoji: '😴',
    locked: true,
    systemPrompt:
      'You coach users toward better sleep hygiene. Provide bedtime rituals, environment tips, and next steps.',
  },
  {
    id: 'vitamins',
    category: 'health',
    titleKey: 'tools.vitamins.title',
    subtitleKey: 'tools.vitamins.subtitle',
    emoji: '💊',
    locked: true,
    systemPrompt:
      'You help users understand vitamins and supplements based on their context. Include safety reminders.',
  },
  {
    id: 'taskReminder',
    category: 'work',
    titleKey: 'tools.taskReminder.title',
    subtitleKey: 'tools.taskReminder.subtitle',
    emoji: '🗓️',
    kind: 'taskReminder',
    systemPrompt:
      'You convert natural-language tasks into JSON calendar events. Respond only with JSON that matches the CalendarEvent schema. Ensure date uses YYYY-MM-DD and include color, icon, allDay, optional times, and notes.',
  },
];
