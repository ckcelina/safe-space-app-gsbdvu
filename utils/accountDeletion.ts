
import { supabase } from '@/lib/supabase';

/**
 * Deletes all user data and the user account itself
 * This is a destructive operation that cannot be undone
 * 
 * @param userId - The ID of the user to delete
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Starting account deletion for user:', userId);

    // Step 1: Delete all messages for this user
    console.log('Deleting messages...');
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return { success: false, error: 'Failed to delete messages' };
    }

    // Step 2: Delete all persons for this user
    console.log('Deleting persons...');
    const { error: personsError } = await supabase
      .from('persons')
      .delete()
      .eq('user_id', userId);

    if (personsError) {
      console.error('Error deleting persons:', personsError);
      return { success: false, error: 'Failed to delete persons' };
    }

    // Step 3: Delete the user profile from public.users
    console.log('Deleting user profile...');
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error('Error deleting user profile:', userError);
      return { success: false, error: 'Failed to delete user profile' };
    }

    // Step 4: Sign out the user (this will clear the session)
    console.log('Signing out user...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('Error signing out:', signOutError);
      return { success: false, error: 'Failed to sign out' };
    }

    console.log('Account deletion completed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error during account deletion:', error);
    return { 
      success: false, 
      error: error?.message || 'An unexpected error occurred' 
    };
  }
}
