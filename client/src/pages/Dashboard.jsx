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
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">My Bookmarks</h1>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1">Logout</button>
      </div>
      <form onSubmit={addBookmark} className="mb-4 flex gap-2">
        <input
          className="border p-2 flex-grow"
          placeholder="Enter URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4">Add</button>
      </form>
      <div className="grid gap-4">
        {bookmarks.map(b => (
          <div key={b.id} className="border p-3 rounded flex items-start gap-3">
            <img src={b.favicon} alt="" className="w-6 h-6 mt-1" />
            <div className="flex-grow">
              <h2 className="font-semibold">{b.title}</h2>
              <p className="text-sm">{b.summary}</p>
            </div>
            <button onClick={() => deleteBookmark(b.id)} className="text-red-500">🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}
