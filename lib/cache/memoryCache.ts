
// Memory cache placeholder
// Provides safe defaults for all cache operations

export const memoryCache = {
  getPeopleList: () => [],
  getPersonById: (id: string) => null,
  setCachedPeople: (people: any[]) => {},
  clearCache: () => {},
  updatePerson: (id: string, updates: any) => {},
};
