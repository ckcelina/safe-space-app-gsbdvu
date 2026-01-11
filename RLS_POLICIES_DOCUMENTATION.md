
# Safe Space - Row Level Security (RLS) Policies

## Overview

All tables in the Safe Space database have Row Level Security (RLS) enabled to ensure users can only access their own data. This document outlines the RLS policies for each table.

## Privacy-by-Design Principles

1. **Data Minimization**: Users can only access their own data
2. **Access Control**: RLS policies enforce user_id = auth.uid() on all operations
3. **Transport Security**: All data is encrypted in transit (HTTPS/TLS)
4. **Storage Security**: Supabase encrypts data at rest
5. **Logging**: No sensitive data (message content, user info) is logged in production

## Table Policies

### 1. users

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own profile: `SELECT WHERE user_id = auth.uid()`
- Users can update their own profile: `UPDATE WHERE user_id = auth.uid()`
- Users can insert their own profile: `INSERT WHERE user_id = auth.uid()`

### 2. messages

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own messages: `SELECT WHERE user_id = auth.uid()`
- Users can create their own messages: `INSERT WHERE user_id = auth.uid()`
- Users can update their own messages: `UPDATE WHERE user_id = auth.uid()`
- Users can delete their own messages: `DELETE WHERE user_id = auth.uid()`

**Privacy Notes**:
- Message content is NEVER logged in production
- Only message metadata (length, timestamp) is logged for debugging
- Messages are only sent to Supabase and OpenAI (server-side via Edge Function)
- No direct client-to-OpenAI calls

### 3. persons

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own persons: `SELECT WHERE user_id = auth.uid()`
- Users can create their own persons: `INSERT WHERE user_id = auth.uid()`
- Users can update their own persons: `UPDATE WHERE user_id = auth.uid()`
- Users can delete their own persons: `DELETE WHERE user_id = auth.uid()`

### 4. person_memories

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own person memories: `SELECT WHERE user_id = auth.uid()`
- Users can create their own person memories: `INSERT WHERE user_id = auth.uid()`
- Users can update their own person memories: `UPDATE WHERE user_id = auth.uid()`
- Users can delete their own person memories: `DELETE WHERE user_id = auth.uid()`

### 5. person_chat_summaries

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own chat summaries: `SELECT WHERE user_id = auth.uid()`
- Users can create their own chat summaries: `INSERT WHERE user_id = auth.uid()`
- Users can update their own chat summaries: `UPDATE WHERE user_id = auth.uid()`
- Users can delete their own chat summaries: `DELETE WHERE user_id = auth.uid()`

### 6. user_preferences

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own preferences: `SELECT WHERE user_id = auth.uid()`
- Users can create their own preferences: `INSERT WHERE user_id = auth.uid()`
- Users can update their own preferences: `UPDATE WHERE user_id = auth.uid()`
- Users can delete their own preferences: `DELETE WHERE user_id = auth.uid()`

### 7. user_personalization_updates

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own updates: `SELECT WHERE user_id = auth.uid()`
- Users can create their own updates: `INSERT WHERE user_id = auth.uid()`
- Users can update their own updates: `UPDATE WHERE user_id = auth.uid()`
- Users can delete their own updates: `DELETE WHERE user_id = auth.uid()`

### 8. user_memory_notes

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own memory notes: `SELECT WHERE user_id = auth.uid()`
- Users can create their own memory notes: `INSERT WHERE user_id = auth.uid()`
- Users can update their own memory notes: `UPDATE WHERE user_id = auth.uid()`
- Users can delete their own memory notes: `DELETE WHERE user_id = auth.uid()`

### 9. person_memory_audit

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own audit logs: `SELECT WHERE user_id = auth.uid()`
- Users can create their own audit logs: `INSERT WHERE user_id = auth.uid()`

### 10. profiles

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own profile: `SELECT WHERE id = auth.uid()`
- Users can update their own profile: `UPDATE WHERE id = auth.uid()`
- Users can insert their own profile: `INSERT WHERE id = auth.uid()`

### 11. memories (Legacy)

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own memories: `SELECT WHERE user_id = auth.uid()`
- Users can create their own memories: `INSERT WHERE user_id = auth.uid()`
- Users can update their own memories: `UPDATE WHERE user_id = auth.uid()`
- Users can delete their own memories: `DELETE WHERE user_id = auth.uid()`

**Note**: This is a legacy table. Use `person_memories` for new data.

### 12. jobs

**RLS Enabled**: ✅ Yes

**Policies**:
- Users can view their own jobs: `SELECT WHERE user_id = auth.uid()`
- Users can create their own jobs: `INSERT WHERE user_id = auth.uid()`
- Users can update their own jobs: `UPDATE WHERE user_id = auth.uid()`

### 13. prompt_bank

**RLS Enabled**: ✅ Yes

**Policies**:
- Public read access for cached prompts
- Admin-only write access

## Edge Function Security

### Service Role Usage

The Edge Function uses the Supabase service role key ONLY for:
1. Writing AI-generated messages to the `messages` table
2. Updating memory notes in `user_memory_notes`

**Important**: Even with service role access, the Edge Function:
- Always includes `user_id` in all database operations
- Respects user ownership (never writes data for other users)
- Never bypasses RLS policies for user data access

### Authentication Flow

1. Client authenticates with Supabase Auth
2. Client sends request to Edge Function with JWT token
3. Edge Function validates JWT token
4. Edge Function uses service role ONLY for necessary writes
5. All writes include the authenticated user's `user_id`

## Logging & Privacy

### What is NEVER logged:
- ❌ Message content (user or AI)
- ❌ User personal information
- ❌ API keys or tokens
- ❌ Memory details

### What IS logged (for debugging):
- ✅ Request metadata (timestamp, user ID prefix)
- ✅ Message count
- ✅ Response length (character count)
- ✅ Error messages (without sensitive data)

### Redaction Functions

All Edge Functions use privacy utilities from `_shared/privacy.ts`:
- `redactMessageContent()`: Redacts message text, shows only length
- `redactUserId()`: Shows only first 8 characters of user ID
- `redactSensitiveFields()`: Automatically redacts sensitive object fields
- `logError()`: Safe error logging with automatic redaction
- `logInfo()`: Safe info logging with automatic redaction

## Transport & Storage Security

### Transport
- ✅ All client-to-Supabase communication uses HTTPS/TLS
- ✅ All Supabase-to-OpenAI communication uses HTTPS/TLS
- ✅ No direct client-to-OpenAI calls (prevents token exposure)

### Storage
- ✅ Supabase encrypts data at rest
- ✅ Database backups are encrypted
- ✅ API keys stored in Supabase secrets (not in code)

## User-Facing Privacy Assurance

Users see the following privacy message in Settings:

> 🔒 Your chats are private. Messages are encrypted in transit and only you can access your data.

## Compliance Checklist

- [x] RLS enabled on all tables
- [x] User can only access their own data
- [x] Service role used only for necessary writes
- [x] No message content logged in production
- [x] All sensitive data redacted from logs
- [x] HTTPS/TLS for all communication
- [x] No direct client-to-OpenAI calls
- [x] User-facing privacy assurance displayed
- [x] Data encrypted in transit and at rest

## Testing RLS Policies

To verify RLS policies are working:

1. Create two test users
2. User A creates a person and sends messages
3. User B attempts to access User A's data
4. Verify User B cannot see User A's data
5. Check Edge Function logs for redacted output

## Maintenance

When adding new tables:
1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Create policies for SELECT, INSERT, UPDATE, DELETE
3. Test with multiple users
4. Update this documentation
5. Add redaction for any sensitive fields

## Support

For privacy-related questions or concerns:
- Email: support@byceli.com
- Privacy Policy: https://www.byceli.com/privacy-policy
