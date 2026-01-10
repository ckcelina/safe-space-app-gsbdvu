
# 🚀 Quick Start Guide - Safe Space App

## ⚡ Get Started in 3 Steps

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Supabase credentials
# Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
```

Your `.env` should look like:
```env
EXPO_PUBLIC_SUPABASE_URL=https://zjzvkxvahrbuuyzjzxol.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_NO_TELEMETRY=1
EXPO_NO_TUNNEL=1
```

### 3️⃣ Start the App
```bash
# Start development server
npm run dev

# Or run directly on iOS
npm run ios

# Or run on Android
npm run android
```

---

## 📱 Testing the App

### Test User Login
1. Open the app
2. Click "Sign Up" to create a new account
3. Or click "Log In" if you already have an account
4. Enter email and password
5. Click "Sign In" or "Create Account"
6. You'll be redirected to the home screen

### Test OAuth Login
1. Click "Continue with Google" or "Continue with Apple"
2. Complete the OAuth flow in the browser
3. You'll be redirected back to the app
4. You'll be logged in and see the home screen

### Test Session Persistence
1. Log in to the app
2. Close the app completely
3. Reopen the app
4. You should still be logged in (no need to log in again)

---

## 🔧 Troubleshooting

### "Cannot connect to Supabase"
- ✅ Check that `.env` file exists and has correct values
- ✅ Verify Supabase URL and Anon Key are correct
- ✅ Make sure you're connected to the internet

### "Login failed"
- ✅ Check that the user exists in Supabase Auth
- ✅ Verify password is correct
- ✅ Check Supabase dashboard for auth errors

### "App crashes on startup"
- ✅ Run `npm install` to ensure all dependencies are installed
- ✅ Clear Metro cache: `npx expo start --clear`
- ✅ Check that all required files exist

### "OAuth not working"
- ✅ Verify OAuth providers are enabled in Supabase dashboard
- ✅ Check redirect URLs are configured correctly
- ✅ Make sure app scheme matches in `app.json` and Supabase settings

---

## 📂 Project Structure

```
├── app/                      # App screens
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── (home)/          # Home tab
│   │   └── profile.tsx      # Profile tab
│   ├── index.tsx            # Entry point (auth check)
│   ├── login.tsx            # Login screen
│   ├── signup.tsx           # Signup screen
│   └── onboarding.tsx       # Onboarding screen
├── components/              # Reusable components
│   ├── ui/                  # UI components
│   └── ErrorBoundary.tsx    # Error handling
├── contexts/                # React contexts
│   ├── AuthContext.tsx      # Authentication state
│   ├── ThemeContext.tsx     # Theme management
│   └── WidgetContext.tsx    # iOS widget support
├── lib/                     # Libraries
│   ├── supabase.ts          # Supabase client
│   └── auth/                # Auth utilities
├── utils/                   # Utility functions
├── .env                     # Environment variables (create this)
└── .env.example             # Environment template
```

---

## 🎯 Key Files

### Authentication
- `contexts/AuthContext.tsx` - Auth state management
- `lib/supabase.ts` - Supabase client configuration
- `app/login.tsx` - Login screen
- `app/signup.tsx` - Signup screen

### Navigation
- `app/_layout.tsx` - Root layout with providers
- `app/index.tsx` - Entry point with auth check
- `app/(tabs)/_layout.tsx` - Tab navigation

### Theme
- `contexts/ThemeContext.tsx` - Theme management
- Four themes: Ocean Blue, Soft Rose, Forest Green, Sunny Yellow

---

## 🔐 Supabase Setup

### Required Tables
Your Supabase project should have these tables:

1. **auth.users** (built-in)
   - Managed by Supabase Auth

2. **public.users**
   ```sql
   CREATE TABLE public.users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     role TEXT DEFAULT 'free',
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **public.persons** (for chat feature)
   ```sql
   CREATE TABLE public.persons (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     relationship_type TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **public.messages** (for chat feature)
   ```sql
   CREATE TABLE public.messages (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
     sender TEXT NOT NULL, -- 'user' or 'ai'
     content TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Enable RLS (Row Level Security)
```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own persons" ON public.persons
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own persons" ON public.persons
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own messages" ON public.messages
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

## 🎨 Customization

### Change App Name
Edit `app.config.ts`:
```typescript
name: "Your App Name",
```

### Change Bundle Identifier
Edit `app.config.ts`:
```typescript
ios: {
  bundleIdentifier: "com.yourcompany.yourapp",
},
android: {
  package: "com.yourcompany.yourapp",
},
```

### Change Theme Colors
Edit `contexts/ThemeContext.tsx` to customize theme colors.

---

## 📞 Support

### Common Commands
```bash
# Clear cache and restart
npx expo start --clear

# Install dependencies
npm install

# Run on specific platform
npm run ios
npm run android
npm run web

# Build for production
eas build --platform ios
eas build --platform android
```

### Useful Links
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/)

---

## ✅ Verification Checklist

Before deploying, verify:
- ✅ App opens without errors
- ✅ Can create new account
- ✅ Can log in with existing account
- ✅ Can log in with Google/Apple
- ✅ User stays logged in after restart
- ✅ Can log out
- ✅ Theme switching works
- ✅ Navigation works
- ✅ No console errors

---

## 🎉 You're Ready!

Your Safe Space app is now fully configured and ready to use. Start the development server and begin building! 🚀
