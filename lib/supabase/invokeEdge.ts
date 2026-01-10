
export async function invokeEdge(functionName: string, body: any) {
  console.log('Invoking edge function:', functionName, body);
  return { data: null, error: null };
}

export async function invokeEdgeSafe(functionName: string, payload: any) {
  return invokeEdge(functionName, payload);
}
