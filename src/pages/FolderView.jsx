import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function FolderView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = Number(userData.id);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setStatus("");

      const params = new URLSearchParams(location.search);
      const password = params.get("password");

      try {
        const folderRes = await api.get(`folders/${id}/`, {
          params: { password: password || "" }
        });
        setFolder(folderRes.data);

        const filesRes = await api.get(`files/`, {
          params: { folder: id, password: password || "" }
        });
        setFiles(filesRes.data);

        const subRes = await api.get(`folders/`, {
          params: { parent: id, password: password || "" }
        });
        setSubfolders(subRes.data);

      } catch (error) {
        if (error.response?.status === 403) {
          alert("Wrong password.");
          navigate("/");
        } else {
          setStatus("Something went wrong.");
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [id, location.search, navigate]);

  if (loading) return <h3 style={{ padding: "20px" }}>Loading...</h3>;
  if (!folder) return null;

  const isOwner = Number(folder.owner_id) === currentUserId;

  const btnStyle = {
    background: "#222",
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    marginRight: "10px",
    cursor: "pointer"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  };

  const cardStyle = {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center",
  };

  const isImage = (filename) => /\.(jpg|jpeg|png)$/i.test(filename);

  // =========================
  // ACTIONS
  // =========================

  const createFolder = async () => {
    const name = prompt("New folder name:");
    if (!name) return;

    const res = await api.post("folders/", {
      name,
      parent: id,
      is_public: true,
      is_listed_in_feed: true
    });

    setSubfolders([...subfolders, res.data]);
    setStatus("Folder created successfully.");
  };

  const uploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      formData.append("name", e.target.files[0].name);
      formData.append("folder", id);

      const res = await api.post("files/", formData);
      setFiles([...files, res.data]);
      setStatus("File uploaded successfully.");
    };
    input.click();
  };

const togglePublic = async () => {
  try {
    // If currently PUBLIC → making PRIVATE
    if (folder.is_public) {
      const password = prompt("Set a password for this private folder:");
      if (!password || password.trim() === "") {
        alert("Password required to make folder private.");
        return;
      }

      const res = await api.patch(`folders/${id}/`, {
        is_public: false,
        password: password
      });

      setFolder(res.data);
      setStatus("Folder is now PRIVATE and password protected.");
    } 
    // If currently PRIVATE → making PUBLIC
    else {
      const res = await api.patch(`folders/${id}/`, {
        is_public: true,
        password: ""  // remove password
      });

      setFolder(res.data);
      setStatus("Folder is now PUBLIC.");
    }
  } catch {
    setStatus("Toggle failed.");
  }
};

  const toggleFeed = async () => {
    const res = await api.patch(`folders/${id}/`, {
      is_listed_in_feed: !folder.is_listed_in_feed
    });

    setFolder(res.data);
    setStatus(res.data.is_listed_in_feed ? "Folder is now visible in FEED." : "Folder removed from FEED.");
  };

  const deleteFolder = async () => {
    if (!window.confirm("Delete this folder?")) return;
    await api.delete(`folders/${id}/`);
    navigate("/");
  };

  const renameFolder = async () => {
  const newName = prompt("Enter new folder name:", folder.name);
  if (!newName || newName.trim() === "") return;

  try {
    const res = await api.patch(`folders/${id}/`, {
      name: newName
    });

    setFolder(res.data);
    setStatus("Folder renamed successfully.");
  } catch {
    setStatus("Rename failed.");
  }
};

  // =========================

  return (
    <div style={{ padding: "20px" }}>
      <h2>{folder.name}</h2>
      <p style={{ color: "#666" }}>{folder.description}</p>

      <p style={{ fontWeight: "bold" }}>
        Status: {folder.is_public ? "Public" : "Private"} | 
        {folder.is_listed_in_feed ? " In Feed" : " Not in Feed"}
      </p>

      {status && (
        <p style={{ color: "green", marginTop: "10px" }}>
          {status}
        </p>
      )}

      {/* OWNER CONTROLS */}
      {isOwner && (
  <div style={{ marginTop: "20px", marginBottom: "20px" }}>
    <button onClick={createFolder} style={btnStyle}>
      + New Folder
    </button>

    <button onClick={uploadFile} style={btnStyle}>
      + Upload File
    </button>

    <button onClick={renameFolder} style={btnStyle}>
      Rename Folder
    </button>

    <button onClick={togglePublic} style={btnStyle}>
      {folder.is_public ? "Make Private" : "Make Public"}
    </button>

    <button onClick={toggleFeed} style={btnStyle}>
      Toggle Feed
    </button>

    <button
      onClick={deleteFolder}
      style={{ ...btnStyle, background: "red" }}
    >
      Delete Folder
    </button>
  </div>
)}

      {/* SUBFOLDERS */}
      <h3>Folders</h3>
      <div style={gridStyle}>
        {subfolders.map((sub) => (
          <div key={sub.id} style={cardStyle}>
            <div
  onClick={async () => {
    if (sub.is_public) {
      navigate(`/folder/${sub.id}`);
      return;
    }

    const password = prompt("Enter folder password:");
    if (!password) return;

    try {
      await api.get(`folders/${sub.id}/`, {
        params: { password }
      });

      navigate(`/folder/${sub.id}?password=${encodeURIComponent(password)}`);
    } catch {
      alert("Wrong password.");
    }
  }}
  style={{ cursor: "pointer" }}
>
              <div style={{ fontSize: "40px" }}>
  {sub.is_public ? "📁" : "🔒"}
</div>

<p>
  {sub.name} {!sub.is_public && "(Private)"}
</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILES */}
      <h3 style={{ marginTop: "40px" }}>Files</h3>
      <div style={gridStyle}>
        {files.map((file) => (
          <div key={file.id} style={cardStyle}>
            <div onClick={() => navigate(`/file/${file.id}`)} style={{ cursor: "pointer" }}>
              {isImage(file.file) ? (
                <img
                  src={file.file}
                  alt={file.name}
                  style={{
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "8px"
                  }}
                />
              ) : (
                <div style={{ fontSize: "40px" }}>📄</div>
              )}
              <p>{file.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FolderView;