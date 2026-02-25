import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FolderCard from "../components/FolderCard";
import api from "../api/axios";
import { useDialog } from "../context/DialogContext";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const dialog = useDialog();

  const [folders, setFolders] = useState([]);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_public: true,
    is_listed_in_feed: false,
    password: "",
  });

  useEffect(() => {
    const token = sessionStorage.getItem("access");
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const res = await api.get("folders/my_folders/");
        setFolders(Array.isArray(res.data) ? res.data : []);
      } catch {
        setFolders([]);
      }
    };

    load();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: form.name,
        description: form.description,
        is_public: form.is_public,
        is_listed_in_feed: form.is_public ? form.is_listed_in_feed : false,
        password: form.is_public ? "" : form.password,
        parent: null,
      };

      const res = await api.post("folders/", payload);
      setFolders((prev) => [res.data, ...prev]);
      setStatus("Folder created.");
      setForm({
        name: "",
        description: "",
        is_public: true,
        is_listed_in_feed: false,
        password: "",
      });
    } catch {
      setStatus("Could not create folder.");
    }
  };

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
    <div className="dashboard-page">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>Back</button>
      <section className="dashboard-create">
        <h2>Create Folder</h2>

        <form onSubmit={handleSubmit}>
          <input
            required
            placeholder="Folder name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label>
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            />
            Public folder
          </label>

          {form.is_public && (
            <label>
              <input
                type="checkbox"
                checked={form.is_listed_in_feed}
                onChange={(e) => setForm({ ...form, is_listed_in_feed: e.target.checked })}
              />
              Show in feed
            </label>
          )}

          {!form.is_public && (
            <input
              required
              type="password"
              placeholder="Folder password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}

          <button type="submit">Create</button>
        </form>

        {status && <p className="dashboard-status">{status}</p>}
      </section>

      <section>
        <h2>My Folders</h2>
        <div className="dashboard-grid">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onOpen={openFolder}
              onLike={toggleLike}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
