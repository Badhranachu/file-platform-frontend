import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Dashboard() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_public: true,
    is_listed_in_feed: false,
  });

  // 🔐 Check login
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login");
    }
  }, []);

  // 📂 Fetch user folders
  useEffect(() => {
    api.get("folders/")
      .then((res) => {
        setFolders(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  // ➕ Create Folder
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("folders/", {
        ...form,
        parent: null,
      });

      setFolders([...folders, res.data]);
      setForm({
        name: "",
        description: "",
        is_public: true,
        is_listed_in_feed: false,
      });
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard</h2>

      {/* Create Folder Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
        <input
          placeholder="Folder Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <label>
          Public?
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) =>
              setForm({ ...form, is_public: e.target.checked })
            }
          />
        </label>

        {form.is_public && (
          <label>
            List in Feed?
            <input
              type="checkbox"
              checked={form.is_listed_in_feed}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_listed_in_feed: e.target.checked,
                })
              }
            />
          </label>
        )}

        <button type="submit">Create Folder</button>
      </form>

      {/* Folder List */}
      <h3>Your Folders</h3>

      {folders.length === 0 && <p>No folders yet.</p>}

      {folders.map((folder) => (
        <div
          key={folder.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h4>{folder.name}</h4>
          <p>{folder.description}</p>
          <p>
            {folder.is_public ? "Public" : "Private"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;