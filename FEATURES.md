# Safe Space App - Complete Feature Specification

## Auth & Onboarding

### Email/Password Sign-Up & Login
- Users can create accounts and log in with email and password
- Login screen includes fields and validation
- Users stay signed in via token refresh
- Signup screen requires:
  - Password confirmation
  - Acceptance of Terms/Privacy (checkboxes) before account creation

### OAuth Login (Google & Apple)
- The app supports third-party OAuth sign-in
- Login and Signup screens provide Google and Apple Sign-In buttons (Apple on iOS only)
- Authentication handled via Supabase

### Forgot/Reset Password
- A "Forgot Password?" link on the Login screen navigates to a reset-password flow
- Reset is via email link to allow users to recover their account

### Onboarding Screen
- After sign-up (or on first launch), users see an onboarding/landing screen with:
  - App logo
  - Title
  - Subtitle
- Buttons allow them to "Create My Safe Space" or "Log In"
- Tapping the logo 5 times reveals a hidden "Reviewer Login" modal for App Store testing (auto-fills review credentials)

### Theme & AI Preferences
- During onboarding, users select a visual theme for the app (at least four themes are supported)
- Users set initial AI preferences
- The navigation stack includes theme-selection and AI-preferences screens as part of onboarding

### Auth Flow & Token Handling
- The app uses a central AuthContext with Supabase
- It manages user sessions, auto-refreshes auth tokens, and redirects between auth screens and the main app
- An error boundary and loading indicator wrap the auth check

### Legal & Profile Settings
- Links to Terms of Service, Privacy Policy, and a "Terms Summary" are available
- The profile/settings section lets the user edit their profile (e.g. name) and log out

## People / Safe Space Contacts

### Person Creation & Management
- Users can create "Person" entries (e.g. friends, family, mentors) by entering:
  - A name
  - Optional relationship
- The UI shows an "Add Person" sheet with name/relationship fields
- Submissions insert into the persons table in Supabase
- The code handles duplicate names (if a person already exists, it reuses the existing record)

### Person List
- The home screen (tab) lists all persons added by the user, each acting as a conversation partner
- Internally, the persons table is queried by user_id
- Selecting a person opens the chat view with that person's personId and personName

### Relationship Metadata
- Each Person entry stores a relationship_type (e.g. "Friend", "Therapist") that is displayed in the chat header
- The relationship can influence AI behavior (the AI "therapist" may adapt based on relationship)

## Chat Interface (AI Conversation)

### Conversation View
- A chat screen lets the user converse with an AI "therapist" for the selected person
- Messages are shown in a scrollable list with date separators (e.g. "Today", "Yesterday") inserted between days
- User messages and AI responses appear in distinct chat bubble components
- Image messages (photos) are displayed in an image bubble

### Subject Tags
- At the top of chat, the user can select or add "Subject" tags (e.g. General, Work, Family)
- These category pills filter or label the conversation
- New subjects can be created via an "+ Add" pill
- Default subjects are defined in code
- A custom pill component handles press animations

### Sending Messages
- The input bar allows multiline text
- The user can type and send messages (up to a length limit)
- Hitting Send inserts the message into messages (Supabase) with the current subject and timestamp
- After sending, the app automatically scrolls to the bottom of the list

### Image Attachments
- Users can attach images by taking a photo or choosing from the library
- On iOS, an ActionSheet with "Take Photo/Choose from Library" appears
- On Android, a simple alert is shown
- The chosen image is uploaded to Supabase Storage
- A message of type image with an image_url is inserted into messages
- A chat image bubble displays the photo

### Real-Time Updates
- The app subscribes to real-time changes on the messages table for the current conversation
- New rows (INSERTs) trigger updates so incoming messages (from the AI or other sources) appear live

### AI Response Generation
- After the user sends a message, an asynchronous call is made to a Supabase Edge Function `generate-ai-response`
- This passes recent conversation history, persona info, and user preferences to an AI backend
- The function returns an AI-generated reply, which is then inserted into the messages table as an assistant message
- A "typing" indicator is shown (via AnimatedTypingIndicator) while waiting

### Therapist Persona Context
- The AI persona (therapist) name/avatar comes from the user's selected therapist persona (from UserPreferences)
- If the user switches therapist personas between messages, the app may warn them (via a banner) before continuing

### Auto-Scroll and UX
- New messages auto-scroll into view
- The interface handles loading states and toasts on errors (e.g. failed sends)
- There are no navigation headers (custom header is built into the screen for back navigation and person name)

## Memories & Continuity

### Automatic Memory Capture
- The app automatically extracts "memories" (key points/patterns) from each user message/AI response
- This happens in the background after sending a message (calling `captureMemoriesFromMessage`) or via a database trigger/edge function after a conversation turn

### Memory Extraction (AI)
- A Supabase Edge Function performs privacy-preserving memory extraction
- It uses a GPT-4o-based prompt to generate a JSON of up to N key points and patterns from the recent conversation
- Sensitive details (names, locations, trauma, etc.) are filtered out by keyword (e.g. no suicide or personal data is stored)

### Memory Storage
- Extracted memory notes are saved in tables (e.g. `person_memories` or `user_memory_notes`) linked to the user and person
- Each memory has fields like category, value, importance, confidence, and a timestamp of last mention
- A Supabase trigger or function likely populates these tables after each message

### Memories UI
- A Memories screen (under Home tab) displays all stored memories for the current person
- Memories are grouped by category (e.g. Goals, Context, Family), with icons and grouping headers
- Users can tap to edit or delete a memory
- There is an "Edit" modal to update or delete each memory

### Continuity Toggle
- Each person has a "Continuity" setting (on/off) that controls whether new memories should be saved
- This toggle lives on the Memories screen
- Toggling continuity updates a flag in Supabase (via `setPersonContinuity`)
- The UI notes that existing memories always display regardless of toggle state

### Data Persistence
- Supabase Row-Level Security is enabled so each user sees only their own data (persons, messages, memories)
- The relevant tables include `persons`, `messages`, and `person_memories` (plus an app-specific users table)

### Error Handling
- The app logs and toasts errors during memory fetches, updates, or deletions
- An Error Boundary at the app root prevents crashes

## Settings & Profile

### Theme Switching
- Users can change the app's color theme at any time (4 themes: e.g. Ocean Blue, Soft Rose, etc.)
- The chosen theme is stored and reloaded on app launch
- The theme context wraps the app UI

### AI Preferences
- A settings screen allows updating AI preferences (tone and "science mode") which affect subsequent AI replies
- These are stored in `user_preferences` (via UserPreferencesContext)

### Edit Profile
- Users can edit their profile (name, display info) and manage account settings (e.g. logout)

### Legal Documents
- Users can view Terms of Service, Privacy Policy, and a brief "Terms Summary" from within the app
- These are static webviews loaded via routes like `/legal/terms-of-service`

### Logout
- A Logout button signs the user out of Supabase and resets app state

## Backend (Supabase) & Data

### Supabase Auth
- The app uses Supabase authentication under the hood (email/password + OAuth)
- The AuthProvider listens to auth state changes and manages tokens via `supabase.auth`
- Includes `onAuthStateChange` to sync sign-out across tabs

### Database Tables
- The main tables are `persons`, `messages`, and memory tables (`person_memories` / `user_memory_notes`)
- Each message row includes `user_id`, `person_id`, `role`, `content/type`, etc.
- Persona records include `user_id`, `name`, `relationship_type`
- Appropriate SQL migrations (e.g. `003_user_memory_notes.sql`) define these schemas

### Edge Functions
- Custom Supabase Edge Functions handle AI logic
- Notably, `generate-ai-response` (invoked from the app) runs GPT on recent conversation to produce a reply
- A secondary function performs memory extraction (as shown by `extractMemoryNotes`) to summarize key points
- These are deployed via Supabase CLI

### Realtime & Triggers
- A Postgres REPLIES channel subscription provides realtime message updates
- Database triggers (e.g. after insert on messages) can call webhooks or functions to automate tasks (like sending notifications or updating memories)

### Storage
- Supabase Storage is used to upload and serve chat images
- The `pickAndUploadImage` utility handles uploading and returns a public URL

### Caching & Utilities
- On app startup, all therapist avatar images are prefetched to cache
- Other utils include a local cache for memories (`memoryCache`) and toast notifications on success/error

## Developer & Moderation Tools

### Reviewer Test Mode
- The hidden 5-tap "Reviewer Login" easter egg allows developers to quickly log in with a test account (Apple Review credentials)

### Debug Logging
- The app includes verbose console logs in development (`__DEV__`) for auth flow, memory operations, and chat events
- Errors show console traces and user-facing toast messages

### Error Boundary
- A global ErrorBoundary wraps the app to catch unexpected crashes and display a fallback UI

### Content Moderation (Privacy)
- The system enforces privacy by filtering out sensitive information (suicide, self-harm, personal data) during memory extraction
- No personal identifiers are stored in memories
- Currently there is no user-facing "report content" feature

### Build & Dev Scripts
- The repository includes setup docs and CI scripts for deploying the Expo app and Supabase edge functions
- Environment variables (Supabase URL/KEY, Expo scheme) are managed via `.env` files

