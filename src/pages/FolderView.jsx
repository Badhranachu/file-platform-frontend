import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function FolderView() {
  const { id } = useParams();
  const navigate = useNavigate();  // ✅ FIX
  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState([]);
const [subfolders, setSubfolders] = useState([]);
useEffect(() => {
api.get(`folders/${id}/`)
  .then((res) => setFolder(res.data))
  .catch(async (err) => {
    if (err.response?.status === 403) {
      const password = prompt("This folder is private. Enter password:");
      if (password) {
        const retry = await api.get(`folders/${id}/?password=${password}`);
        setFolder(retry.data);
      }
    }
  });
    api.get(`files/?folder=${id}`).then((res) => setFiles(res.data));
  api.get(`folders/?parent=${id}`).then((res) => setSubfolders(res.data));
}, [id]);
  if (!folder) return <p>Loading...</p>;
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
  cursor: "pointer",
  transition: "0.2s",
};
const isImage = (filename) => {
  return /\.(jpg|jpeg|png)$/i.test(filename);
  
};

  return (
  <div style={{ padding: "20px" }}>
  <h2>{folder.name}</h2>
  <p style={{ color: "#666" }}>{folder.description}</p>

  {/* Subfolders Section */}
  <h3 style={{ marginTop: "30px" }}>Folders</h3>

  {subfolders.length === 0 && <p>No subfolders.</p>}

  <div style={gridStyle}>
    {subfolders.map((sub) => (
      <div
        key={sub.id}
        onClick={() => navigate(`/folder/${sub.id}`)}
        style={cardStyle}
      >
        <div style={{ fontSize: "40px" }}>📁</div>
        <p style={{ marginTop: "10px", fontWeight: "500" }}>
          {sub.name}
        </p>
      </div>
    ))}
  </div>

  {/* Files Section */}
  <h3 style={{ marginTop: "40px" }}>Files</h3>

  {files.length === 0 && <p>No files uploaded.</p>}

  <div style={gridStyle}>
  {files.map((file) => {
    console.log(file);   // ✅ now valid

    return (
      <div
        key={file.id}
        onClick={() => navigate(`/file/${file.id}`)}
        style={cardStyle}
      >
        {isImage(file.file) && file.file ? (   // 👈 FIXED HERE
          <img
            src={file.file}
            alt={file.name}
            onError={(e) => (e.target.style.display = "none")}
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

        <p style={{ marginTop: "10px", fontWeight: "500" }}>
          {file.name}
        </p>
      </div>
    );
  })}
</div>
</div>
);
}

export default FolderView;