import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function Feed() {
  const [folders, setFolders] = useState([]);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = userData.id;

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = () => {
    api.get("folders/feed/")
      .then((res) => setFolders(res.data))
      .catch(() => setFolders([]));
  };

  // ✅ CREATE NEW ROOT FOLDER
  const createFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name || name.trim() === "") return;

    try {
      const res = await api.post("folders/", {
        name: name,
        parent: null, // 🔥 important → top-level
        is_public: true,
        is_listed_in_feed: true
      });

      setFolders([res.data, ...folders]);
      setStatus("Folder created successfully.");
    } catch {
      setStatus("Failed to create folder.");
    }
  };

  const handleClick = async (folder) => {
    if (folder.is_public) {
      navigate(`/folder/${folder.id}`);
      return;
    }

    if (folder.owner_id === currentUserId) {
      navigate(`/folder/${folder.id}`);
      return;
    }

    const password = prompt("Enter folder password:");
    if (!password) return;

    try {
      await api.get(`folders/${folder.id}/`, {
        params: { password }
      });

      navigate(`/folder/${folder.id}?password=${encodeURIComponent(password)}`);
    } catch {
      alert("Wrong password.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Public Feed</h2>

      {/* ✅ Show Create Button Only If Logged In */}
      {currentUserId && (
        <button
          onClick={createFolder}
          style={{
            padding: "8px 14px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            marginBottom: "20px",
            cursor: "pointer"
          }}
        >
          + Create New Folder
        </button>
      )}

      {status && (
        <p style={{ color: "green" }}>{status}</p>
      )}

      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => handleClick(folder)}
          style={{
            cursor: "pointer",
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {folder.owner_profile_photo && (
              <img
                src={folder.owner_profile_photo}
                alt="profile"
                width="40"
                height="40"
                style={{ borderRadius: "50%" }}
              />
            )}
            <strong>{folder.owner_username}</strong>
          </div>

          <h3>
            {folder.is_public ? "📁" : "🔒"} {folder.name}
          </h3>

          <p>{folder.description}</p>

          <div style={{ fontSize: "14px", color: "gray" }}>
            📁 {folder.subfolder_count} Folders | 📄 {folder.file_count} Files
          </div>
        </div>
      ))}
    </div>
  );
}

export default Feed;