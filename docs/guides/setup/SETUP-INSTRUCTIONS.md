
# Safe Space - Setup Instructions

## Overview
Safe Space is a mobile app that provides a safe place to talk about the people in your life, with AI-powered support through Supabase Edge Functions.

## Prerequisites
- A Supabase account and project
- OpenAI API key (for the Edge Function)

## Setup Steps

### 1. Connect Supabase
1. In Natively, press the **Supabase** button
2. Connect to your existing Supabase project
3. Provide your `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 2. Create Database Tables
Run the SQL commands in `supabase-schema.sql` in your Supabase SQL Editor. This will create:
- `public.users` - User profiles with roles
- `public.persons` - People the user talks about
- `public.messages` - Chat messages between user and AI

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

### 3. Deploy Edge Function
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Create the function directory:
   ```bash
   mkdir -p supabase/functions/generate-ai-response
   ```
5. Copy the code from `supabase-edge-function-example.ts` to `supabase/functions/generate-ai-response/index.ts`
6. Set your OpenAI API key as a secret:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_api_key
   ```
7. Deploy the function:
   ```bash
   supabase functions deploy generate-ai-response
   ```

### 4. Test the App
1. Launch the app in Natively
2. Complete onboarding and select a theme
3. Sign up with email and password
4. Add a person to talk about
5. Start chatting!

## Features

### Authentication
- Email/password signup and login
- Automatic user profile creation
- Graceful error handling (app works even if profile creation fails)

### User Roles
- **Free**: Default role for all new users
- **Premium**: Unlocks full features (managed in database)
- **Admin**: Administrative access (managed in database)

### Themes
- Ocean Blue (default)
- Soft Rose
- Forest Green

### Chat Features
- Real-time messaging with AI
- Message history per person
- Typing indicators
- Persistent chat history

## Database Schema

### public.users
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `role`: TEXT ('free', 'premium', 'admin')
- `created_at`: TIMESTAMP

### public.persons
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `name`: TEXT
- `relationship_type`: TEXT
- `created_at`: TIMESTAMP

### public.messages
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `person_id`: UUID (references persons)
- `sender`: TEXT ('user' or 'ai')
- `content`: TEXT
- `created_at`: TIMESTAMP

## Security
- All tables use Row Level Security (RLS)
- Users can only access their own data
- Authentication required for all operations
- Secure session management with AsyncStorage

## Troubleshooting

### "No storage option exists to persist the session"
This warning is normal and can be ignored. The app uses AsyncStorage for session persistence.

### User profile not created after signup
The app is designed to handle this gracefully. The profile will be created automatically on next login.

### AI not responding
1. Check that the Edge Function is deployed
2. Verify your OpenAI API key is set correctly
3. Check Supabase function logs for errors

### Can't see messages
1. Verify RLS policies are enabled
2. Check that user_id matches auth.uid()
3. Ensure person_id is valid

## Support
For issues or questions, check the Supabase logs and console.log statements throughout the app for debugging information.
