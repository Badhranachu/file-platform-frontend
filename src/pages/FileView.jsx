import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function FileView() {
  const { id } = useParams();
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.get(`files/${id}/`)
      .then((res) => setFile(res.data))
      .catch((err) => console.log(err));
  }, [id]);

  if (!file) return <p>Loading...</p>;
const API_BASE = import.meta.env.VITE_API_BASE_URL.replace("/api/", "");
const fileUrl = `${API_BASE}${file.file}`;
const extension = file.file.split(".").pop().toLowerCase();

  console.log(fileUrl)

  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const videoTypes = ["mp4", "webm", "ogg"];
  const audioTypes = ["mp3", "wav", "ogg"];

  return (
    <div style={{ padding: "20px" }}>
      <h2>{file.name}</h2>

      {/* PDF Preview */}
     {extension === "pdf" && (
  <div style={{ marginTop: "20px" }}>
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: "10px 20px",
        background: "#2563eb",
        color: "white",
        borderRadius: "6px",
        textDecoration: "none"
      }}
    >
      Open PDF
    </a>
  </div>
)}

      {/* Image Preview */}
      {imageTypes.includes(extension) && (
        <img
          src={fileUrl}
          alt={file.name}
          style={{ maxWidth: "100%", marginTop: "20px" }}
        />
      )}

      {/* Video Preview */}
      {videoTypes.includes(extension) && (
        <video controls width="100%" style={{ marginTop: "20px" }}>
          <source src={fileUrl} type={`video/${extension}`} />
        </video>
      )}

      {/* Audio Preview */}
      {audioTypes.includes(extension) && (
        <audio controls style={{ marginTop: "20px" }}>
          <source src={fileUrl} type={`audio/${extension}`} />
        </audio>
      )}

      {/* Other Files */}
      {!(
        extension === "pdf" ||
        imageTypes.includes(extension) ||
        videoTypes.includes(extension) ||
        audioTypes.includes(extension)
      ) && (
        <div style={{ marginTop: "20px" }}>
          <p>Preview not available.</p>
          <a href={fileUrl} download>
            Download File
          </a>
        </div>
      )}
    </div>
  );
}

export default FileView;