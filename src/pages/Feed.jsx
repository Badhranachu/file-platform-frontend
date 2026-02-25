import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import "./Feed.css";

function Feed() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const dialog = useDialog();

  const [folders, setFolders] = useState([]);
  const [status, setStatus] = useState("");

  const fetchFeed = async () => {
    try {
      const res = await api.get("folders/feed/");
      setFolders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFolders([]);
    }
  };

  useEffect(() => {
    if (!user) {
      setFolders([]);
      return;
    }
    fetchFeed();
  }, [user]);

  const handleCreateRootFolder = async () => {
    const name = await dialog.prompt("Enter folder name:", {
      title: "Create Folder",
      placeholder: "Folder name",
      confirmText: "Create",
    });
    if (!name?.trim()) return;

    try {
      const res = await api.post("folders/", {
        name: name.trim(),
        parent: null,
        is_public: true,
        is_listed_in_feed: true,
      });
      setFolders((prev) => [res.data, ...prev]);
      setStatus("Folder created.");
    } catch {
      setStatus("Folder creation failed.");
    }
  };

  const openFolder = async (folder) => {
    if (folder.is_public || folder.owner_id === user?.id) {
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

  if (!user) {
    return (
      <div className="home-page">
        <section className="home-hero">
          <div className="home-hero-badge">Edu Drive Platform</div>
          <h1>Store, Share, and Track Learning Content in One Secure Workspace</h1>
          <p>
            Edu Drive is a folder-based file collaboration system built with Django REST API and React.
            Create public or private folders, protect content with passwords, and manage everything with
            session-based authentication.
          </p>

          <div className="home-hero-actions">
            <button type="button" onClick={() => navigate("/login")}>Login</button>
            <button type="button" onClick={() => navigate("/register")}>Register</button>
          </div>
        </section>

        <section className="home-grid">
          <article>
            <h3>Private & Public Folders</h3>
            <p>Create open folders for sharing or private folders with password protection.</p>
          </article>

          <article>
            <h3>Likes & Engagement</h3>
            <p>Users can like folders and maintain a personal liked collection page.</p>
          </article>

          <article>
            <h3>Viewer Insights</h3>
            <p>Track how many users viewed each folder to understand content reach.</p>
          </article>

          <article>
            <h3>Modern Stack</h3>
            <p>Django + DRF + JWT backend with a responsive React + Vite frontend.</p>
          </article>
        </section>

        <section className="home-flow">
          <h2>How This Project Works</h2>
          <div className="home-flow-steps">
            <div>
              <span>01</span>
              <h4>Create Account</h4>
              <p>Register and login using secure token-based session auth.</p>
            </div>
            <div>
              <span>02</span>
              <h4>Manage Folders</h4>
              <p>Create root folders, subfolders, upload files, and control visibility.</p>
            </div>
            <div>
              <span>03</span>
              <h4>Collaborate</h4>
              <p>Browse feed, like useful folders, and monitor folder views.</p>
            </div>
          </div>
        </section>

        <section className="home-cta">
          <h2>Start Building Your Knowledge Space</h2>
          <p>Join Edu Drive and organize your academic or project files with clarity.</p>
          <div className="home-hero-actions">
            <button type="button" onClick={() => navigate("/register")}>Create Free Account</button>
            <button type="button" onClick={() => navigate("/login")}>I Already Have an Account</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <div className="feed-header">
        <div>
          <h1>Folder Feed</h1>
          {/* <p>Instagram-style folder stream with likes and view counts.</p> */}
          <div className="feed-tabs">
            <button type="button" className="active">Feed</button>
            <button type="button" onClick={() => navigate("/following")}>Following</button>
          </div>
        </div>

        <button type="button" onClick={handleCreateRootFolder}>
          Create Folder
        </button>
      </div>

      {status && <div className="feed-status">{status}</div>}

      <section className="feed-list">
        {folders.map((folder) => (
          <article key={folder.id} className="feed-post">
            <header className="feed-post-header">
              <div className="feed-post-owner">
                {folder.owner_profile_photo ? (
                  <img src={folder.owner_profile_photo} alt={folder.owner_username} />
                ) : (
                  <div className="feed-post-owner-fallback">
                    {(folder.owner_username || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <strong
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/users/${folder.owner_id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/users/${folder.owner_id}`);
                    }}
                  >
                    {folder.owner_username}
                  </strong>
                  <p>{folder.is_public ? "Public Folder" : "Private Folder"}</p>
                </div>
              </div>
              <span className="feed-post-code">{folder.folder_code}</span>
            </header>

            <button type="button" className="feed-post-body" onClick={() => openFolder(folder)}>
              <h2>{folder.name}</h2>
              <p>{folder.description || "No description provided."}</p>
            </button>

            <footer className="feed-post-footer">
              <div>
                {(folder.is_public || Number(folder.owner_id) === Number(user?.id)) && (
                  <>
                    <span>Folders {folder.subfolder_count}</span>
                    <span>Files {folder.file_count}</span>
                    <span>Views {folder.view_count}</span>
                  </>
                )}
                <span>Comments {folder.comment_count}</span>
              </div>

              <button type="button" onClick={() => toggleLike(folder)}>
                {folder.is_liked ? "Unlike" : "Like"} ({folder.like_count})
              </button>
            </footer>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Feed;
