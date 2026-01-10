
export async function upsertPersonMemories(userId: string, personId: string, memories: any[]) {
  console.log('Upserting memories:', { userId, personId, memories });
  return { success: true };
}
