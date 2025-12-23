
import { supabase } from '../supabase';

const DEFAULT_CONTINUITY_STATE = {
  continuity_enabled: true,
  current_goal: '',
  open_loops: '',
  last_user_need: '',
  last_action_plan: '',
  next_best_question: '',
};

export const getPersonContinuity = async (userId: string, personId: string) => {
  try {
    const { data, error } = await supabase
      .from('person_chat_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .single();

    if (error || !data) {
      __DEV__ && console.debug('Error fetching continuity, returning defaults:', error);
      return DEFAULT_CONTINUITY_STATE;
    }

    return {
      continuity_enabled: data.continuity_enabled ?? true,
      current_goal: data.current_goal ?? '',
      open_loops: data.open_loops ?? '',
      last_user_need: data.last_user_need ?? '',
      last_action_plan: data.last_action_plan ?? '',
      next_best_question: data.next_best_question ?? '',
    };
  } catch (error) {
    __DEV__ && console.debug('Unexpected error fetching continuity, returning defaults:', error);
    return DEFAULT_CONTINUITY_STATE;
  }
};

export const upsertPersonContinuity = async (
  userId: string,
  personId: string,
  patch: Partial<typeof DEFAULT_CONTINUITY_STATE>
) => {
  try {
    const { error } = await supabase
      .from('person_chat_summaries')
      .upsert({
        user_id: userId,
        person_id: personId,
        ...patch,
      }, { onConflict: 'user_id, person_id' });

    if (error) {
      __DEV__ && console.debug('Error upserting continuity:', error);
    }
  } catch (error) {
    __DEV__ && console.debug('Unexpected error upserting continuity:', error);
  }
};

export const setContinuityEnabled = async (userId: string, personId: string, enabled: boolean) => {
  try {
    await upsertPersonContinuity(userId, personId, { continuity_enabled: enabled });
  } catch (error) {
    __DEV__ && console.debug('Unexpected error setting continuity enabled:', error);
  }
};
