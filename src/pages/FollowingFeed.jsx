import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useDialog } from "../context/DialogContext";
import "./FollowingFeed.css";

function FollowingFeed() {
  const navigate = useNavigate();
  const dialog = useDialog();
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "null");
  const [folders, setFolders] = useState([]);
  const [status, setStatus] = useState("");

  const loadFollowingFeed = async () => {
    try {
      const res = await api.get("folders/following_feed/");
      setFolders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStatus("Could not load following feed.");
    }
  };

  useEffect(() => {
    loadFollowingFeed();
  }, []);

  const openFolder = async (folder) => {
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
      setFolders((prev) =>
        prev.map((item) =>
          item.id === folder.id
            ? { ...item, is_liked: res.data.liked, like_count: res.data.like_count }
            : item
        )
      );
    } catch {
      setStatus("Could not update like.");
    }
  };

  return (
    <div className="following-page">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>Back</button>
      <h1>Following Feed</h1>
      <p>New folder posts from people you follow.</p>
      {status && <p className="following-status">{status}</p>}

      <section className="following-list">
        {folders.map((folder) => (
          <article key={folder.id} className="following-post">
            <header>
              <button type="button" onClick={() => navigate(`/users/${folder.owner_id}`)}>
                @{folder.owner_username}
              </button>
              <span>{folder.folder_code}</span>
            </header>

            <button type="button" className="following-body" onClick={() => openFolder(folder)}>
              <h3>{folder.name}</h3>
              <p>{folder.description || "No description."}</p>
            </button>

            <footer>
              <div>
                {(folder.is_public || Number(folder.owner_id) === Number(currentUser?.id)) && (
                  <span>Views {folder.view_count}</span>
                )}
                <span>Likes {folder.like_count}</span>
                <span>Comments {folder.comment_count}</span>
              </div>
              <button type="button" onClick={() => toggleLike(folder)}>
                {folder.is_liked ? "Unlike" : "Like"}
              </button>
            </footer>
          </article>
        ))}
      </section>
    </div>
  );
}

export default FollowingFeed;
