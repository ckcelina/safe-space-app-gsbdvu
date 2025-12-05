
import { supabase } from '@/lib/supabase';

/**
 * Deletes all user data and the user account itself using the Supabase Edge Function
 * This is a destructive operation that cannot be undone
 * 
 * @param userId - The ID of the user to delete
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Starting account deletion for user:', userId);

    // Get the current session to pass the auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return { success: false, error: 'No active session' };
    }

    // Call the Supabase Edge Function to delete the account
    console.log('Calling delete-user-account Edge Function...');
    const { data, error } = await supabase.functions.invoke('delete-user-account', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Error calling delete-user-account function:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete account' 
      };
    }

    if (data && !data.success) {
      console.error('Account deletion failed:', data.error);
      return { 
        success: false, 
        error: data.error || 'Failed to delete account' 
      };
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
