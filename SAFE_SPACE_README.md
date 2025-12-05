
# Safe Space App - Documentation

## Overview
Safe Space is a mobile app built with React Native + Expo 54 that uses Supabase for authentication, database, and AI-powered conversations via Edge Functions.

## Features

### Authentication
- Email/password signup with email verification
- Secure login with Supabase Auth
- Automatic user profile creation
- Role-based access (free, premium, admin)

### Core Functionality
1. **Onboarding**: Theme selection (Ocean Blue, Soft Rose, Forest Green)
2. **Home Screen**: List of people you want to talk about
3. **Chat Screen**: AI-powered conversations about specific people
4. **Profile Screen**: View account details, change theme, sign out

## Database Schema

### Tables
1. **users** (public.users)
   - id: uuid (primary key, references auth.users)
   - email: text
   - username: text
   - role: text ('free', 'premium', 'admin')
   - created_at: timestamp

2. **people** (public.people)
   - id: uuid (primary key)
   - user_id: uuid (foreign key to users)
   - name: text
   - relationship_type: text
   - created_at: timestamp

3. **messages** (public.messages)
   - id: uuid (primary key)
   - user_id: uuid (foreign key to users)
   - person_id: uuid (foreign key to people)
   - role: text ('user' or 'assistant')
   - content: text
   - created_at: timestamp

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring users can only access their own data.

## Supabase Configuration

### Environment Variables
The app uses the Supabase client configured in:
- `lib/supabase.ts` (uses EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY)
- `app/integrations/supabase/client.ts` (hardcoded credentials for your project)

### Edge Function
**generate-ai-response**
- Receives: `{ person_id, messages }`
- Returns: `{ reply }`
- Uses OpenAI GPT-4o-mini for AI responses
- Requires OPENAI_API_KEY environment variable

## File Structure

```
app/
├── (tabs)/
│   ├── (home)/
│   │   ├── index.tsx          # Home screen (list of people)
│   │   └── chat.tsx           # Chat screen
│   └── profile.tsx            # Profile screen
├── _layout.tsx                # Root layout with providers
├── onboarding.tsx             # Theme selection
├── signup.tsx                 # Signup screen
└── login.tsx                  # Login screen

contexts/
├── AuthContext.tsx            # Authentication state
└── ThemeContext.tsx           # Theme management

types/
└── database.types.ts          # TypeScript types

styles/
└── commonStyles.ts            # Theme colors and styles
```

## Key Features

### Error Handling
- Non-blocking user profile creation
- Graceful fallback for AI failures
- Clear error messages for users

### Theme System
- Three built-in themes
- Persistent theme selection
- Dynamic color updates throughout app

### AI Integration
- Secure backend processing via Edge Function
- Context-aware conversations
- Empathetic AI responses

## Usage

### Adding a Person
1. Tap the + button on home screen
2. Enter person's name
3. Enter relationship type
4. Start chatting!

### Chatting
1. Select a person from the list
2. Type your message
3. AI responds with empathetic guidance
4. Messages are saved automatically

### Changing Theme
1. Go to Profile tab
2. Tap "Change Theme"
3. Select your preferred theme

## Security Notes
- All API calls go through Supabase
- OpenAI API key is stored securely in Edge Function environment
- RLS policies protect user data
- Email verification required for login

## Future Enhancements
- Premium subscription features
- Advanced AI capabilities
- Export conversation history
- Custom themes
