
# Quick Reference: Duplicate Names for Persons

## 🎯 Goal
Allow users to add multiple people with the same name (e.g., 2 moms, 2 dads) and ensure they appear immediately in the People list.

## ⚡ Quick Setup (3 Steps)

### Step 1: Run Database Migration
```sql
ALTER TABLE persons DROP CONSTRAINT IF EXISTS persons_user_id_name_unique;
```
**Where:** Supabase Dashboard → SQL Editor → Run

### Step 2: Dependencies Installed ✅
- `uuid` - Already installed
- `@types/uuid` - Already installed

### Step 3: Code Updated ✅
- `AddPersonSheet.tsx` - Generates UUIDs, no duplicate checking
- `Home index.tsx` - Already has proper refresh logic

## 🔧 How It Works

### Adding a Person
```typescript
// 1. Generate UUID client-side
const newPersonId = uuidv4();

// 2. Insert with UUID
const payload = {
  id: newPersonId,
  user_id: userId,
  name: trimmedName,
  relationship_type: relationshipType || null,
  created_at: new Date().toISOString(),
};

// 3. Insert into Supabase
await supabase.from('persons').insert([payload]);

// 4. Optimistic update + data re-sync
onPersonCreated(newPerson);
```

### Fetching People
```typescript
// Fetch all persons (excluding Topics)
const { data } = await supabase
  .from('persons')
  .select('*')
  .eq('user_id', userId)
  .or('relationship_type.is.null,relationship_type.neq.Topic')
  .order('created_at', { ascending: false });
```

## ✅ Testing

### Test 1: Add Duplicates
1. Add "Mom" → ✅ Appears
2. Add "Mom" again → ✅ Both appear
3. Verify different IDs → ✅ Unique

### Test 2: Immediate Appearance
1. Add person → ✅ Appears instantly
2. Navigate away → ✅ Still there
3. Return to Home → ✅ Still there

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "duplicate key" error | Run the migration (Step 1) |
| Person doesn't appear | Check `onPersonCreated()` is called |
| Person appears twice | Check optimistic update logic |
| Person disappears | Verify insert succeeded in DB |

## 📝 Key Points
- ✅ Duplicates by name are **allowed**
- ✅ Each person has a **unique UUID**
- ✅ Newest persons appear **first** (ordered by `created_at DESC`)
- ✅ List refreshes **on screen focus**
- ✅ Optimistic update + data re-sync for **instant feedback**

## 🔗 Related Files
- `components/ui/AddPersonSheet.tsx` - Person creation
- `app/(tabs)/(home)/index.tsx` - Home screen with list
- `types/database.types.ts` - Person interface
- `lib/supabase.ts` - Supabase client
