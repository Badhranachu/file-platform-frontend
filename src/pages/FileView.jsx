import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import "./FileView.css";

function FileView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const commentsRef = useRef(null);

  const [file, setFile] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const password = query.get("password") || "";
  const folderId = query.get("folder") || "";
  const openComments = query.get("openComments") === "1";

  useEffect(() => {
    const loadFile = async () => {
      try {
        const [fileRes, commentsRes] = await Promise.all([
          api.get(`files/${id}/`, { params: { password } }),
          api.get("file-comments/", { params: { file: id } }),
        ]);

        const loadedFile = fileRes.data;
        setFile(loadedFile);
        setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);

        const effectiveFolderId = folderId || loadedFile?.folder;

        if (effectiveFolderId) {
          const filesRes = await api.get("files/", {
            params: { folder: effectiveFolderId, password },
          });
          const list = Array.isArray(filesRes.data) ? filesRes.data : [];
          setFolderFiles(list);
          setCurrentIndex(list.findIndex((f) => Number(f.id) === Number(id)));
        } else {
          setFolderFiles([]);
          setCurrentIndex(-1);
        }
      } catch {
        setError("Could not load file.");
      }
    };

    loadFile();
  }, [id, password, folderId]);

  useEffect(() => {
    if (openComments) {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [openComments, file]);

  const postComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post("file-comments/", {
        file: id,
        text: commentText.trim(),
      });
      setComments((prev) => [res.data, ...prev]);
      setCommentText("");
    } catch {
      setError("Could not add comment.");
    }
  };

  if (error) return <div className="file-page">{error}</div>;
  if (!file) return <div className="file-page">Loading...</div>;

  const fileUrl = file.file;
  const extension = file.file.split(".").pop().toLowerCase();

  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const videoTypes = ["mp4", "webm", "ogg", "mov"];
  const audioTypes = ["mp3", "wav", "ogg"];

  const hasNavigation = folderFiles.length > 1 && currentIndex >= 0;
  const effectiveFolderId = folderId || file.folder;

  const goToRelativeFile = (offset) => {
    if (!hasNavigation) return;
    const targetIndex = (currentIndex + offset + folderFiles.length) % folderFiles.length;
    const target = folderFiles[targetIndex];
    navigate(
      `/file/${target.id}?folder=${effectiveFolderId}${
        password ? `&password=${encodeURIComponent(password)}` : ""
      }`
    );
  };

  return (
    <div className="file-page">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>Back</button>
      <h1>{file.name}</h1>
      <p>
        Open folder:
        <button type="button" className="inline-link" onClick={() => navigate(`/folder/${file.folder}`)}>
          {` #${file.folder}`}
        </button>
      </p>

      {extension === "pdf" && (
        <a className="file-button" href={fileUrl} target="_blank" rel="noreferrer">
          Open PDF
        </a>
      )}

      {imageTypes.includes(extension) && <img src={fileUrl} alt={file.name} className="file-image" />}

      {videoTypes.includes(extension) && (
        <video controls className="file-media">
          <source src={fileUrl} type={`video/${extension}`} />
        </video>
      )}

      {audioTypes.includes(extension) && (
        <audio controls className="file-media">
          <source src={fileUrl} type={`audio/${extension}`} />
        </audio>
      )}

      {!imageTypes.includes(extension) &&
        !videoTypes.includes(extension) &&
        !audioTypes.includes(extension) &&
        extension !== "pdf" && (
          <a href={fileUrl} download className="file-button">
            Download File
          </a>
        )}

      {hasNavigation && (
        <div className="file-nav-controls">
          <button type="button" className="file-nav-btn" onClick={() => goToRelativeFile(-1)}>← Previous</button>
          <span className="file-nav-index">{currentIndex + 1}/{folderFiles.length}</span>
          <button type="button" className="file-nav-btn" onClick={() => goToRelativeFile(1)}>Next →</button>
        </div>
      )}

      <section className="file-comments" ref={commentsRef}>
        <h3>File Comments</h3>
        <div className="file-comments-form">
          <textarea
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="button" onClick={postComment}>Post Comment</button>
        </div>
        <div className="file-comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="file-comment-item">
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
      </section>
    </div>
  );
}

export default FileView;
