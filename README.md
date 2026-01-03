# Safe Space

A mental health support app built with React Native, Expo, and Supabase.

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Configuration

See [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) for detailed setup instructions.

### Required Configuration

- **Supabase URL** - Your Supabase project URL
- **Supabase Anon Key** - Your Supabase anonymous/public API key

### Optional Configuration

- **Backend URL** - Custom backend API URL (only if using additional backend services)

## Development

```bash
# Start with tunnel (recommended for testing on physical devices)
npm run dev

# Start with LAN
npm run dev:lan

# Start with localhost
npm run dev:localhost

# Run on specific platform
npm run ios
npm run android
npm run web
```

## Features

- 🔐 Secure authentication with Supabase
- 💬 AI-powered chat support
- 📝 Memory tracking and personalization
- 🎨 Multiple theme options
- 📚 Resource library
- 🔔 Widget support (iOS)

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **Supabase** - Backend as a Service
- **TypeScript** - Type safety
- **Expo Router** - File-based routing

## Troubleshooting

If you see a "Configuration Required" screen:
1. Ensure `.env` file exists with valid Supabase credentials
2. Restart the Expo dev server
3. Check the console for configuration status logs

For more help, see [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md).

Made with 💙 for creativity.
