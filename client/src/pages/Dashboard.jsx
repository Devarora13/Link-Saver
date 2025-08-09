import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/api/bookmarks", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookmarks(data));
  }, [token]);

  const addBookmark = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (res.ok) {
      setBookmarks([...bookmarks, data]);
      setUrl("");
    } else {
      alert(data.message);
    }
  };

  const deleteBookmark = async (id) => {
    await fetch(`http://localhost:5000/api/bookmarks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📌 My Bookmarks</h1>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
        <form onSubmit={addBookmark} className="mb-6 flex gap-2">
          <input
            className="border border-gray-300 rounded-lg p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
            Add
          </button>
        </form>
        <div className="grid gap-4">
          {bookmarks.map(b => (
            <div
              key={b.id}
              className="border border-gray-200 rounded-lg p-4 flex items-start gap-3 hover:shadow-lg transition"
            >
              <img src={b.favicon} alt="" className="w-6 h-6 mt-1" />
              <div className="flex-grow">
                <h2 className="font-semibold text-gray-800">{b.title}</h2>
                <p className="text-sm text-gray-600">{b.summary}</p>
              </div>
              <button
                onClick={() => deleteBookmark(b.id)}
                className="text-red-500 hover:text-red-700"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
