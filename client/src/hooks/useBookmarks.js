import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useBookmarks = () => {
  const [allBookmarks, setAllBookmarks] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const { token } = useAuth();

  // Fetch all bookmarks
  const fetchBookmarks = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAllBookmarks(data);
      setBookmarks(data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Add bookmark
  const addBookmark = useCallback(async (url, tags = []) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    setAdding(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookmarks`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ url, tags })
      });
      const data = await response.json();
      
      if (response.ok) {
        setAllBookmarks(prev => [...prev, data]);
        return { success: true, data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    } finally {
      setAdding(false);
    }
  }, [token]);

  // Delete bookmark
  const deleteBookmark = useCallback(async (id) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookmarks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setAllBookmarks(prev => prev.filter(b => b.id !== id));
        setBookmarks(prev => prev.filter(b => b.id !== id));
        return { success: true };
      } else {
        return { success: false, message: 'Failed to delete' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  }, [token]);

  // Reorder bookmarks
  const reorderBookmarks = useCallback(async (newOrder) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookmarks/reorder`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ order: newOrder.map(b => b.id) })
      });
      
      if (response.ok) {
        setBookmarks(newOrder);
        setAllBookmarks(newOrder);
        return { success: true };
      } else {
        return { success: false, message: 'Failed to reorder' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  }, [token]);

  // Refresh summary
  const refreshSummary = useCallback(async (bookmarkId) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookmarks/${bookmarkId}/refresh-summary`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        const updateBookmark = (prev) => prev.map(x => 
          x.id === bookmarkId ? { ...x, summary: data.summary, summaryError: null } : x
        );
        setBookmarks(updateBookmark);
        setAllBookmarks(updateBookmark);
        return { success: true, data };
      } else {
        return { success: false, message: data.message + (data.error ? `: ${data.error}` : '') };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  }, [token]);

  // Filter bookmarks
  const filterBookmarks = useCallback((query) => {
    if (!query.trim()) {
      setBookmarks(allBookmarks);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = allBookmarks.filter(b => {
      const tagText = (b.tags || []).join(' ').toLowerCase();
      const titleText = (b.title || '').toLowerCase();
      return tagText.includes(lowerQuery) || titleText.includes(lowerQuery);
    });
    setBookmarks(filtered);
  }, [allBookmarks]);

  // Initial load
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return {
    bookmarks,
    allBookmarks,
    loading,
    adding,
    addBookmark,
    deleteBookmark,
    reorderBookmarks,
    refreshSummary,
    filterBookmarks,
    refetch: fetchBookmarks
  };
};
