
# Safe Space - Quick Start Guide

## 🚀 Getting Started

### Step 1: Enable Supabase
1. Click the **Supabase** button in Natively
2. Connect to your Supabase project
3. Enter your `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### Step 2: Set Up Database
Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor to create:
- Users table
- Persons table  
- Messages table
- RLS policies

### Step 3: Deploy Edge Function
1. Copy code from `supabase-edge-function-example.ts`
2. Deploy as "generate-ai-response" Edge Function
3. Set your OpenAI API key as a secret

### Step 4: Launch the App
1. Run the app in Natively
2. Complete onboarding
3. Sign up with email/password
4. Start adding people and chatting!

## 📱 App Flow

1. **Onboarding** → Choose your theme (Ocean Blue, Soft Rose, Forest Green)
2. **Signup** → Create account with email/password
3. **Login** → Sign in to existing account
4. **Home** → View list of persons, add new persons
5. **Chat** → Talk about a specific person with AI support
6. **Profile** → View account info, change theme, sign out

## 🎨 Themes

- **Ocean Blue**: Calm and professional (default)
- **Soft Rose**: Warm and comforting
- **Forest Green**: Natural and grounding

## 🔐 Security Features

- Row Level Security (RLS) on all tables
- Users can only access their own data
- Secure session management
- Password requirements enforced

## 💡 Key Features

- **Multi-person support**: Talk about different people separately
- **AI-powered responses**: Get empathetic support from AI
- **Message history**: All conversations are saved
- **Role-based access**: Free, Premium, and Admin roles
- **Theme customization**: Choose your preferred color scheme

## 🛠️ Troubleshooting

**Can't connect to Supabase?**
- Verify your URL and anon key are correct
- Check that your Supabase project is active

**AI not responding?**
- Ensure Edge Function is deployed
- Check OpenAI API key is set correctly
- View Supabase function logs for errors

**Profile not created?**
- This is normal - it will be created automatically
- The app works even if profile creation fails initially

## 📊 Database Structure

```
auth.users (Supabase built-in)
  └── public.users (role, created_at)
      └── public.persons (name, relationship_type)
          └── public.messages (sender, content)
```

## 🎯 Next Steps

1. Customize the AI prompt in the Edge Function
2. Add more themes in ThemeContext
3. Implement premium features
4. Add message search functionality
5. Enable push notifications

## 📝 Notes

- All console.log statements are included for debugging
- Error handling is graceful - app won't crash
- RLS ensures data privacy
- AsyncStorage persists sessions locally

Enjoy using Safe Space! 🌟
