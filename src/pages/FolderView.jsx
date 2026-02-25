import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import "./FolderView.css";

function FolderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const dialog = useDialog();

  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [mediaIndex, setMediaIndex] = useState(-1);

  const password = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("password") || "";
  }, [location.search]);

  const getExt = (path = "") => path.split("?")[0].split(".").pop()?.toLowerCase() || "";
  const isImage = (path) => ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(getExt(path));
  const isVideo = (path) => ["mp4", "webm", "ogg", "mov"].includes(getExt(path));

  const mediaFiles = useMemo(
    () => files.filter((f) => isImage(f.file) || isVideo(f.file)),
    [files]
  );

  const fetchFolderData = async () => {
    setLoading(true);
    setStatus("");

    try {
      const [folderRes, filesRes, subfoldersRes, commentsRes] = await Promise.all([
        api.get(`folders/${id}/`, { params: { password } }),
        api.get("files/", { params: { folder: id, password } }),
        api.get("folders/", { params: { parent: id, password } }),
        api.get("folder-comments/", { params: { folder: id } }),
      ]);

      setFolder(folderRes.data);
      setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
      setSubfolders(Array.isArray(subfoldersRes.data) ? subfoldersRes.data : []);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
    } catch (error) {
      if (error?.response?.status === 403) {
        await dialog.alert("Wrong password. Please try again.", { title: "Access Denied" });
        navigate("/");
      } else {
        setStatus("Could not load folder details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolderData();
  }, [id, password]);

  if (loading) return <div className="folder-loader">Loading folder...</div>;
  if (!folder) return <div className="folder-loader">Folder not found.</div>;

  const isOwner = Number(folder.owner_id) === Number(user?.id);

  const handleCreateSubfolder = async () => {
    const name = await dialog.prompt("Subfolder name:", {
      title: "Create Subfolder",
      placeholder: "Subfolder name",
      confirmText: "Create",
    });
    if (!name?.trim()) return;

    try {
      const res = await api.post("folders/", {
        name: name.trim(),
        parent: id,
        is_public: folder.is_public,
        is_listed_in_feed: false,
      });
      setSubfolders((prev) => [...prev, res.data]);
      setStatus("Subfolder created.");
    } catch {
      setStatus("Could not create subfolder.");
    }
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 100 * 1024 * 1024) {
        await dialog.alert("File must be under 100MB.", { title: "Upload limit" });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("folder", id);

      try {
        setUploading(true);
        setUploadProgress(0);

        const res = await api.post("files/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (pe) => {
            if (!pe.total) return;
            const percent = Math.round((pe.loaded * 100) / pe.total);
            setUploadProgress(percent);
          },
        });

        setFiles((prev) => [...prev, res.data]);
        setStatus("File uploaded.");
      } catch {
        setStatus("Upload failed.");
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const handleToggleVisibility = async () => {
    try {
      if (folder.is_public) {
        const newPassword = await dialog.prompt("Set password for private folder:", {
          title: "Make Private",
          placeholder: "Password",
          confirmText: "Save",
        });
        if (!newPassword?.trim()) {
          await dialog.alert("Password is required for private folders.", { title: "Missing password" });
          return;
        }

        const res = await api.patch(`folders/${id}/`, {
          is_public: false,
          password: newPassword,
        });
        setFolder(res.data);
        setStatus("Folder is now private.");
        return;
      }

      const res = await api.patch(`folders/${id}/`, {
        is_public: true,
        password: "",
      });
      setFolder(res.data);
      setStatus("Folder is now public.");
    } catch {
      setStatus("Could not change visibility.");
    }
  };

  const handleToggleFeed = async () => {
    try {
      const res = await api.patch(`folders/${id}/`, {
        is_listed_in_feed: !folder.is_listed_in_feed,
      });
      setFolder(res.data);
      setStatus(res.data.is_listed_in_feed ? "Folder listed in feed." : "Folder removed from feed.");
    } catch {
      setStatus("Could not update feed status.");
    }
  };

  const handleRename = async () => {
    const newName = await dialog.prompt("Rename folder:", {
      title: "Rename Folder",
      defaultValue: folder.name || "",
      placeholder: "Folder name",
      confirmText: "Rename",
    });
    if (!newName?.trim()) return;

    try {
      const res = await api.patch(`folders/${id}/`, { name: newName.trim() });
      setFolder(res.data);
      setStatus("Folder renamed.");
    } catch {
      setStatus("Rename failed.");
    }
  };

  const handleDelete = async () => {
    const confirmed = await dialog.confirm("Delete folder permanently?", {
      title: "Delete Folder",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    try {
      await api.delete(`folders/${id}/`);
      navigate("/");
    } catch {
      setStatus("Delete failed.");
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const res = await api.post(`folders/${id}/like/`);
      setFolder((prev) => ({
        ...prev,
        is_liked: res.data.liked,
        like_count: res.data.like_count,
      }));
    } catch {
      setStatus("Could not update like.");
    }
  };

  const openSubfolder = async (sub) => {
    if (sub.is_public || Number(sub.owner_id) === Number(user?.id)) {
      navigate(`/folder/${sub.id}`);
      return;
    }

    const subPassword = await dialog.prompt("Enter folder password:", {
      title: "Private Folder",
      placeholder: "Password",
      confirmText: "Open",
    });
    if (!subPassword) return;

    try {
      await api.get(`folders/${sub.id}/`, { params: { password: subPassword } });
      navigate(`/folder/${sub.id}?password=${encodeURIComponent(subPassword)}`);
    } catch {
      await dialog.alert("Wrong password. Please try again.", { title: "Access Denied" });
    }
  };

  const openFile = (file) => {
    if (isImage(file.file) || isVideo(file.file)) {
      const idx = mediaFiles.findIndex((m) => Number(m.id) === Number(file.id));
      setMediaIndex(idx);
      return;
    }

    navigate(`/file/${file.id}?folder=${folder.id}${password ? `&password=${encodeURIComponent(password)}` : ""}`);
  };

  const openFileComments = (file) => {
    navigate(
      `/file/${file.id}?folder=${folder.id}${password ? `&password=${encodeURIComponent(password)}` : ""}&openComments=1`
    );
  };

  const slideMedia = (dir) => {
    if (!mediaFiles.length) return;
    setMediaIndex((prev) => {
      if (prev < 0) return 0;
      const next = (prev + dir + mediaFiles.length) % mediaFiles.length;
      return next;
    });
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post("folder-comments/", {
        folder: id,
        text: commentText.trim(),
      });
      setComments((prev) => [res.data, ...prev]);
      setCommentText("");
    } catch {
      setStatus("Could not add comment.");
    }
  };

  const activeMedia = mediaIndex >= 0 ? mediaFiles[mediaIndex] : null;

  return (
    <div className="folder-page">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>Back</button>

      <section className="folder-summary">
        <div>
          <h1>{folder.name}</h1>
          <p>{folder.description || "No description"}</p>
          <p>
            Owner: <button type="button" className="inline-link" onClick={() => navigate(`/users/${folder.owner_id}`)}>
              {folder.owner_username}
            </button>
          </p>
        </div>

        <div className="folder-pill-wrap">
          <span>{folder.is_public ? "Public" : "Private"}</span>
          <span>{folder.is_listed_in_feed ? "In Feed" : "Not In Feed"}</span>
          <span>Code: {folder.folder_code}</span>
          <span>Views: {folder.view_count}</span>
          <span>Likes: {folder.like_count}</span>
        </div>

        <div className="folder-main-actions">
          {user && (
            <button type="button" onClick={handleLike}>
              {folder.is_liked ? "Unlike" : "Like"}
            </button>
          )}
        </div>

        {isOwner && (
          <div className="folder-owner-actions">
            <button type="button" onClick={handleCreateSubfolder}>New Folder</button>
            <button type="button" onClick={handleUpload}>Upload File</button>
            <button type="button" onClick={handleRename}>Rename</button>
            <button type="button" onClick={handleToggleVisibility}>Toggle Public/Private</button>
            <button type="button" onClick={handleToggleFeed}>Toggle Feed</button>
            <button type="button" className="danger" onClick={handleDelete}>Delete</button>
          </div>
        )}

        {uploading && (
          <div className="folder-upload">
            <div className="folder-upload-bar" style={{ width: `${uploadProgress}%` }} />
            <span>{uploadProgress}%</span>
          </div>
        )}

        {status && <div className="folder-status">{status}</div>}
      </section>

      <section>
        <h2>Subfolders</h2>
        <div className="folder-grid">
          {subfolders.map((sub) => (
            <button key={sub.id} className="folder-sub" type="button" onClick={() => openSubfolder(sub)}>
              <strong>{sub.name}</strong>
              <span>{sub.is_public ? "Public" : "Private"}</span>
              <span>Views: {sub.view_count}</span>
              <span>Likes: {sub.like_count}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Files</h2>
        <div className="folder-grid">
          {files.map((file) => (
            <article key={file.id} className="folder-file-card">
              <button type="button" className="folder-file" onClick={() => openFile(file)}>
                <div className="media-thumb-wrap">
                  {isImage(file.file) ? (
                    <img src={file.file} alt={file.name} className="media-thumb" />
                  ) : isVideo(file.file) ? (
                    <video src={file.file} className="media-thumb" />
                  ) : (
                    <div className="media-file-placeholder">FILE</div>
                  )}
                </div>
                <strong>{file.name}</strong>
              </button>
              <button type="button" className="file-comments-link" onClick={() => openFileComments(file)}>
                Comments ({file.comment_count || 0})
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="folder-interactions">
        <div className="interaction-box">
          <h3>Folder Comments</h3>
          <div className="interaction-form">
            <textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="button" onClick={postComment}>Post Comment</button>
          </div>
          <div className="interaction-list">
            {comments.map((comment) => (
              <div key={comment.id} className="interaction-item">
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => navigate(`/users/${comment.owner}`)}
                >
                  {comment.owner_username}
                </button>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeMedia && (
        <div className="media-viewer" onClick={() => setMediaIndex(-1)}>
          <div className="media-viewer-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="media-close" onClick={() => setMediaIndex(-1)}>Close</button>
            <button type="button" className="media-nav left" onClick={() => slideMedia(-1)}>‹</button>
            <div className="media-stage">
              {isImage(activeMedia.file) ? (
                <img src={activeMedia.file} alt={activeMedia.name} className="media-stage-content" />
              ) : (
                <video src={activeMedia.file} controls className="media-stage-content" />
              )}
            </div>
            <button type="button" className="media-nav right" onClick={() => slideMedia(1)}>›</button>
            <p className="media-caption">{activeMedia.name} ({mediaIndex + 1}/{mediaFiles.length})</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FolderView;
