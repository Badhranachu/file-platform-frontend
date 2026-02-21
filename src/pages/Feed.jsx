import { useEffect, useState } from "react";
import api from "../api/axios";
  import { useNavigate } from "react-router-dom";

function Feed() {
  const [folders, setFolders] = useState([]);

const navigate = useNavigate();

  useEffect(() => {
    api.get("folders/feed/").then((res) => {
      setFolders(res.data);
    });
  }, []);

  return (
    <div>
      <h2>Public Feed</h2>
      {folders.map((folder) => (
  <div
    key={folder.id}
    onClick={() => {
      const token = localStorage.getItem("access");

      if (!token) {
        alert("You need to login to view this folder.");
        navigate("/login");
        return;
      }

      navigate(`/folder/${folder.id}`);
    }}
    style={{
      cursor: "pointer",
      border: "1px solid #ccc",
      padding: "15px",
      marginBottom: "10px",
    }}
  >
    {/* Owner Section */}
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

    {/* Folder Info */}
    <h3>{folder.name}</h3>
    <p>{folder.description}</p>

    {/* Counts */}
    <div style={{ fontSize: "14px", color: "gray" }}>
      📁 {folder.subfolder_count} Folders | 📄 {folder.file_count} Files
    </div>
  </div>
))}
    </div>
  );
}

export default Feed;