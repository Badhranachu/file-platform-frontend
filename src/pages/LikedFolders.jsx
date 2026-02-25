import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FolderCard from "../components/FolderCard";
import api from "../api/axios";
import { useDialog } from "../context/DialogContext";
import "./LikedFolders.css";

function LikedFolders() {
  const navigate = useNavigate();
  const dialog = useDialog();
  const [folders, setFolders] = useState([]);
  const [status, setStatus] = useState("");

  const loadLiked = async () => {
    try {
      const res = await api.get("folders/liked/");
      setFolders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStatus("Could not load liked folders.");
    }
  };

  useEffect(() => {
    loadLiked();
  }, []);

  const openFolder = async (folder) => {
    const currentUser = JSON.parse(sessionStorage.getItem("user") || "null");
    if (folder.is_public || Number(folder.owner_id) === Number(currentUser?.id)) {
      navigate(`/folder/${folder.id}`);
      return;
    }

    const password = await dialog.prompt("Enter folder password:", {
      title: "Private Folder",
      placeholder: "Password",
      confirmText: "Open",
    });
    if (!password) return;

    try {
      await api.get(`folders/${folder.id}/`, { params: { password } });
      navigate(`/folder/${folder.id}?password=${encodeURIComponent(password)}`);
    } catch {
      await dialog.alert("Wrong password. Please try again.", { title: "Access Denied" });
    }
  };

  const toggleLike = async (folder) => {
    try {
      const res = await api.post(`folders/${folder.id}/like/`);
      if (!res.data.liked) {
        setFolders((prev) => prev.filter((item) => item.id !== folder.id));
      }
    } catch {
      setStatus("Could not update like.");
    }
  };

  return (
    <div className="liked-page">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>Back</button>
      <h1>Liked Folders</h1>
      {status && <p className="liked-status">{status}</p>}

      <div className="liked-grid">
        {folders.map((folder) => (
          <FolderCard key={folder.id} folder={folder} onOpen={openFolder} onLike={toggleLike} />
        ))}
      </div>
    </div>
  );
}

export default LikedFolders;
