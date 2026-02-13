import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@flybook_search_history';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
};

export const saveSearchQuery = async (query: string): Promise<void> => {
  if (!query.trim()) return;

  try {
    const history = await getSearchHistory();

    // Remove existing entry for the same query to move it to the top
    const updatedHistory = history.filter(
      item => item.query.toLowerCase() !== query.toLowerCase(),
    );

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: Date.now(),
    };

    // Add to the beginning and limit to 20 items
    const finalHistory = [newItem, ...updatedHistory].slice(0, 20);

    await AsyncStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(finalHistory),
    );
  } catch (error) {
    console.error('Error saving search query:', error);
  }
};

export const deleteSearchItem = async (
  id: string,
): Promise<SearchHistoryItem[]> => {
  try {
    const history = await getSearchHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(updatedHistory),
    );
    return updatedHistory;
  } catch (error) {
    console.error('Error deleting search item:', error);
    return [];
  }
};

export const clearSearchHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};
