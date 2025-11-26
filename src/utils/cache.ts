import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'dekonvi',
  storeName: 'cache'
});

export const cacheKeys = {
  LISTINGS: 'listings',
  USER_DATA: 'userData',
  CATEGORIES: 'categories',
  FAVORITES: 'favorites'
};

export async function setCache(key: string, data: unknown): Promise<void> {
  try {
    await localforage.setItem(key, {
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function getCache<T>(key: string, maxAge = 3600000): Promise<T | null> {
  try {
    const cached = await localforage.getItem(key) as { data: T; timestamp: number } | null;

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      await localforage.removeItem(key);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    await localforage.clear();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

export async function removeFromCache(key: string): Promise<void> {
  try {
    await localforage.removeItem(key);
  } catch (error) {
    console.error('Error removing from cache:', error);
  }
}