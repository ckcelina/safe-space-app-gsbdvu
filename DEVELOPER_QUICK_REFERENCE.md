
# Developer Quick Reference - Safe Space Data Model Fixes

## 🚨 Critical Rules for Developers

### 1. ALWAYS Filter by user_id
```typescript
// ✅ CORRECT - Always include user_id filter
const { data } = await supabase
  .from('persons')
  .select('*')
  .eq('user_id', userId);  // ← REQUIRED

// ❌ WRONG - Missing user_id filter
const { data } = await supabase
  .from('persons')
  .select('*');
```

### 2. ALWAYS Use Both Filters for Deletes
```typescript
// ✅ CORRECT - Both user_id AND id
const { error } = await supabase
  .from('persons')
  .delete()
  .eq('id', personId)
  .eq('user_id', userId);  // ← Prevents cross-user deletion

// ❌ WRONG - Only id filter
const { error } = await supabase
  .from('persons')
  .delete()
  .eq('id', personId);
```

### 3. NEVER Check for Duplicate Names
```typescript
// ✅ CORRECT - Direct insert
const { data } = await supabase
  .from('persons')
  .insert([{ user_id, name, relationship_type }]);

// ❌ WRONG - Checking for duplicates
const { data: existing } = await supabase
  .from('persons')
  .select('*')
  .eq('user_id', userId)
  .ilike('name', name);
if (existing) {
  throw new Error('Duplicate name');
}
```

### 4. ALWAYS Use person.id as Key
```typescript
// ✅ CORRECT - Use UUID as key
{persons.map((person) => (
  <PersonCard key={person.id} person={person} />
))}

// ❌ WRONG - Using name as key
{persons.map((person) => (
  <PersonCard key={person.name} person={person} />
))}
```

### 5. ALWAYS Prevent Chat Loops
```typescript
// ✅ CORRECT - In-flight guard
const isGeneratingRef = useRef(false);
if (isGeneratingRef.current) return;
isGeneratingRef.current = true;

// ❌ WRONG - No guard
const sendMessage = async () => {
  // Multiple calls can happen
};
```

---

## 📋 Data Model Reference

### persons Table
```typescript
interface Person {
  id: string;              // UUID - PRIMARY KEY (unique identifier)
  user_id: string;         // UUID - References auth.users
  name: string;            // NOT UNIQUE (duplicates allowed)
  relationship_type: string | null;
  created_at: string;
}
```

**Key Points:**
- `id` is the ONLY unique identifier
- `name` can be duplicated (multiple "Dad" entries allowed)
- `user_id` ensures data isolation
- `relationship_type` is metadata only (not for grouping)

### messages Table
```typescript
interface Message {
  id: string;              // UUID - PRIMARY KEY
  user_id: string;         // UUID - References auth.users
  person_id: string;       // UUID - References persons.id
  role: 'user' | 'assistant';
  content: string;
  subject?: string;        // Topic/subject of conversation
  created_at: string;
}
```

**Key Points:**
- `user_id` AND `person_id` both required for queries
- `subject` enables topic-based conversations
- `role` replaces old `sender` field

---

## 🔒 RLS Policies (Database Level)

### persons Table Policies
```sql
-- SELECT: Users can view own persons
USING (auth.uid() = user_id)

-- INSERT: Users can insert own persons
WITH CHECK (auth.uid() = user_id)

-- UPDATE: Users can update own persons
USING (auth.uid() = user_id)

-- DELETE: Users can delete own persons
USING (auth.uid() = user_id)
```

### messages Table Policies
```sql
-- SELECT: Users can view own messages
USING (auth.uid() = user_id)

-- INSERT: Users can insert own messages
WITH CHECK (auth.uid() = user_id)
```

---

## 🛡️ Security Checklist

Before deploying any code that touches persons or messages:

- [ ] All SELECT queries include `.eq('user_id', userId)`
- [ ] All DELETE queries include BOTH `.eq('id', id)` AND `.eq('user_id', userId)`
- [ ] All UPDATE queries include `.eq('user_id', userId)`
- [ ] No duplicate name checking logic
- [ ] person.id used as unique key in React components
- [ ] Chat loop prevention guards in place

---

## 🎯 Common Patterns

### Fetching Persons
```typescript
const fetchPersons = async (userId: string) => {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', userId)  // ← REQUIRED
    .order('created_at', { ascending: false });
  
  return data;
};
```

### Fetching Messages
```typescript
const fetchMessages = async (userId: string, personId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)      // ← REQUIRED
    .eq('person_id', personId)  // ← REQUIRED
    .order('created_at', { ascending: true });
  
  return data;
};
```

### Deleting Person
```typescript
const deletePerson = async (userId: string, personId: string) => {
  // 1. Delete messages first
  await supabase
    .from('messages')
    .delete()
    .eq('user_id', userId)      // ← REQUIRED
    .eq('person_id', personId); // ← REQUIRED
  
  // 2. Delete person
  await supabase
    .from('persons')
    .delete()
    .eq('id', personId)         // ← REQUIRED
    .eq('user_id', userId);     // ← REQUIRED
};
```

### Creating Person (No Duplicate Check)
```typescript
const createPerson = async (userId: string, name: string, relationshipType: string) => {
  // NO duplicate checking - just insert
  const { data, error } = await supabase
    .from('persons')
    .insert([{
      user_id: userId,
      name: name.trim(),
      relationship_type: relationshipType.trim() || null,
    }])
    .select()
    .single();
  
  return data;
};
```

### Sending Message (Loop Prevention)
```typescript
const sendMessage = async () => {
  // Guard against multiple calls
  if (isGeneratingRef.current) return;
  isGeneratingRef.current = true;
  
  try {
    // 1. Insert user message
    const { data: userMsg } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        person_id: personId,
        role: 'user',
        content: text,
        subject: currentSubject,
      })
      .select()
      .single();
    
    // 2. Track processed message
    lastProcessedUserMessageIdRef.current = userMsg.id;
    
    // 3. Get AI response
    const { data: aiResponse } = await supabase.functions.invoke(
      'generate-ai-response',
      { body: { personId, messages: recentMessages } }
    );
    
    // 4. Insert AI message
    await supabase
      .from('messages')
      .insert({
        user_id: userId,
        person_id: personId,
        role: 'assistant',
        content: aiResponse.reply,
        subject: currentSubject,
      });
  } finally {
    isGeneratingRef.current = false;
  }
};
```

---

## 🐛 Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting user_id Filter
```typescript
// WRONG - Can see other users' data
const { data } = await supabase
  .from('persons')
  .select('*');
```

### ❌ Mistake 2: Using Name as Key
```typescript
// WRONG - Breaks with duplicate names
{persons.map((person) => (
  <div key={person.name}>...</div>
))}
```

### ❌ Mistake 3: Checking for Duplicates
```typescript
// WRONG - Duplicates are allowed now
if (existingPerson) {
  throw new Error('Person already exists');
}
```

### ❌ Mistake 4: Single Filter on Delete
```typescript
// WRONG - Could delete other users' data
await supabase
  .from('persons')
  .delete()
  .eq('id', personId);
```

### ❌ Mistake 5: No Loop Prevention
```typescript
// WRONG - Can trigger multiple AI calls
const sendMessage = async () => {
  // No guard - re-renders can call this multiple times
  await generateAIResponse();
};
```

---

## 📊 UI/UX Guidelines

### People List Display
- **Single section:** "People" (not "Family", "Friends", etc.)
- **Sort order:** Most recently added first (created_at DESC)
- **Relationship type:** Show as metadata under name
- **Duplicate names:** Differentiate by relationship type
- **Search:** Filter by name OR relationship type

### Add Person Modal
- **No duplicate warnings:** Allow saving any name
- **Immediate refresh:** List updates after save
- **Success feedback:** Show toast on successful save
- **Error handling:** Generic error messages only

### Chat Screen
- **Subject pills:** Show available subjects at top
- **Message history:** Filter by current subject
- **Loop prevention:** Disable send while generating
- **Context:** Include last 20 messages for AI

---

## 🔍 Debugging Tips

### Check User Isolation
```typescript
// Log user_id in all queries
console.log('[Query] Fetching persons for user:', userId);
const { data } = await supabase
  .from('persons')
  .select('*')
  .eq('user_id', userId);
console.log('[Query] Found persons:', data?.length);
```

### Check Duplicate Handling
```typescript
// Log person creation
console.log('[Create] Creating person:', { name, relationshipType });
const { data, error } = await supabase
  .from('persons')
  .insert([personData]);
console.log('[Create] Result:', { success: !error, personId: data?.id });
```

### Check Chat Loop
```typescript
// Log message flow
console.log('[Chat] Sending message, isGenerating:', isGeneratingRef.current);
console.log('[Chat] Last processed:', lastProcessedUserMessageIdRef.current);
console.log('[Chat] Message count:', messages.length);
```

---

## 📚 Related Files

- `app/(tabs)/(home)/index.tsx` - People list and Add Person logic
- `app/(tabs)/(home)/chat.tsx` - Chat screen and message handling
- `lib/supabase.ts` - Supabase client configuration
- `types/database.types.ts` - TypeScript interfaces
- `MIGRATION_ALLOW_DUPLICATE_NAMES.sql` - Database migration

---

## 🆘 Need Help?

1. Check `DATA_MODEL_FIXES_SUMMARY.md` for detailed explanations
2. Check `TESTING_GUIDE.md` for test scenarios
3. Review RLS policies in Supabase dashboard
4. Check console logs for debugging info
5. Verify migration was applied successfully

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Database migration applied
- [ ] All queries include user_id filter
- [ ] Delete operations use both filters
- [ ] No duplicate name checking
- [ ] person.id used as React keys
- [ ] Chat loop guards in place
- [ ] RLS policies verified
- [ ] Multi-user testing completed
- [ ] Duplicate name testing completed
- [ ] Chat loop testing completed

---

**Last Updated:** [Current Date]  
**Version:** 1.0  
**Status:** Production Ready ✅
