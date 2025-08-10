import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineLightMode, MdOutlineDarkMode } from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useBookmarks } from "../hooks/useBookmarks";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [filterInput, setFilterInput] = useState(""); // simple substring filter
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { 
    bookmarks, 
    loading, 
    adding, 
    addBookmark, 
    deleteBookmark, 
    reorderBookmarks, 
    refreshSummary, 
    filterBookmarks 
  } = useBookmarks();

  // Filter bookmarks when filterInput changes
  useEffect(() => {
    filterBookmarks(filterInput);
  }, [filterInput, filterBookmarks]);

  const handleAddBookmark = async (e) => {
    e.preventDefault();
    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const result = await addBookmark(url, tags);
    
    if (result.success) {
      setUrl("");
      setTagsInput("");
    } else {
      alert(result.message);
    }
  };

  const handleDeleteBookmark = async (id) => {
    const result = await deleteBookmark(id);
    if (!result.success) {
      alert(result.message);
    }
  };

  const handleLogout = () => {
    authLogout();
    navigate("/");
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;
    
    const current = [...bookmarks];
    const fromIdx = current.findIndex(b => b.id === sourceId);
    const toIdx = current.findIndex(b => b.id === targetId);
    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved);
    
    const result = await reorderBookmarks(current);
    if (!result.success) {
      alert(result.message);
    }
  };

  const handleRefreshSummary = async (bookmarkId) => {
    const result = await refreshSummary(bookmarkId);
    if (!result.success) {
      alert(result.message);
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${dark ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'}` }>
      <div className={`max-w-3xl mx-auto rounded-2xl shadow-2xl p-6 ${dark ? 'bg-gray-800' : 'bg-white' }`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>📌 My Bookmarks</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={toggleTheme} className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm">
            {dark ? <MdOutlineLightMode size={20}/> : <MdOutlineDarkMode size={20}/>}
          </button>
          <input
            value={filterInput}
            onChange={e=> setFilterInput(e.target.value)}
            placeholder="Search tags or titles..."
            className={`border border-gray-300 rounded-lg p-2 flex-grow text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
          />
          {filterInput && (
            <button onClick={()=> setFilterInput('')} className="text-sm text-indigo-600">Clear</button>
          )}
        </div>
        <form onSubmit={handleAddBookmark} className="mb-6 flex flex-col md:flex-row gap-2">
          <input
            className={`border border-gray-300 rounded-lg p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
            placeholder="Enter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <input
            className={`border border-gray-300 rounded-lg p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
            placeholder="tags (comma separated)"
            value={tagsInput}
            onChange={(e)=>setTagsInput(e.target.value)}
          />
          <button
            disabled={adding}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition duration-200 ${
              adding ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </form>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bookmarks...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookmarks.length === 0 && filterInput ? (
              <div className="text-center py-8 text-gray-500">
                No bookmarks match "{filterInput}"
              </div>
            ) : (
              bookmarks.map(b => (
              <div
                key={b.id}
                className="border border-gray-200 rounded-lg p-4 flex items-start gap-3 hover:shadow-lg hover:-translate-y-1 transform transition duration-200"
                draggable
                onDragStart={(e)=>handleDragStart(e,b.id)}
                onDragOver={handleDragOver}
                onDrop={(e)=>handleDrop(e,b.id)}
              >
                <img src={b.favicon} alt="" className="w-6 h-6 mt-1" />
                <div className="flex-grow">
                  <h2 className={`font-semibold mb-3 ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{b.title}</h2>
                  <p className={`text-sm whitespace-pre-line max-h-48 overflow-auto ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{b.summary}</p>
                  <div className="mt-1 flex flex-wrap gap-2 items-center">
                    {typeof b.fallbackUsed === 'boolean' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.fallbackUsed ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>{b.fallbackUsed ? 'Fallback summary' : 'AI summary'}</span>
                    )}
                    {b.summaryStatus && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">HTTP {b.summaryStatus}</span>
                    )}
                    {b.summaryError && (
                      <span title={b.summaryError} className="text-[10px] px-2 py-0.5 rounded-full bg-red-200 text-red-700 cursor-help">Err</span>
                    )}
                  </div>
                  {b.summary === '[Summary unavailable]' && (
                    <button
                      onClick={() => handleRefreshSummary(b.id)}
                      className="mt-2 text-xs text-indigo-600 hover:underline"
                    >Retry summary</button>
                  )}
                  {b.tags && b.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {b.tags.map(t=> <span key={t} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{t}</span>)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteBookmark(b.id)}
                  className="text-red-500 hover:text-red-700 transition duration-200"
                >
                  🗑
                </button>
              </div>
            )))}
          </div>
        )}
      </div>
    </div>
  );
}
