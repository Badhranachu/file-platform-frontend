import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FolderCard from "../components/FolderCard";
import api from "../api/axios";
import { useDialog } from "../context/DialogContext";
import "./UserProfile.css";

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dialog = useDialog();

  const [profile, setProfile] = useState(null);
  const [folders, setFolders] = useState([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    try {
      const [profileRes, foldersRes] = await Promise.all([
        api.get(`accounts/users/${id}/`),
        api.get(`accounts/users/${id}/folders/`),
      ]);
      setProfile(profileRes.data);
      setFolders(Array.isArray(foldersRes.data) ? foldersRes.data : []);
    } catch {
      setStatus("Could not load profile.");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const toggleFollow = async () => {
    try {
      const res = await api.post(`accounts/users/${id}/follow/`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: res.data.following,
              followers_count: res.data.followers_count,
            }
          : prev
      );
    } catch {
      setStatus("Could not update follow.");
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

  if (!profile) {
    return <div className="profile-page">{status || "Loading profile..."}</div>;
  }

  return (
    <div className="profile-page">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>Back</button>
      <section className="profile-header">
        <div className="profile-user">
          {profile.profile_photo ? (
            <img src={profile.profile_photo} alt={profile.username} />
          ) : (
            <div className="profile-fallback">{profile.username?.slice(0, 1)?.toUpperCase()}</div>
          )}
          <div>
            <h1>{profile.username}</h1>
            <p>{profile.email}</p>
            <p>Followers: {profile.followers_count} | Following: {profile.following_count}</p>
          </div>
        </div>
        {Number(profile.id) !== Number(JSON.parse(sessionStorage.getItem("user") || "null")?.id) && (
          <div className="profile-header-actions">
            <button type="button" onClick={toggleFollow}>
              {profile.is_following ? "Unfollow" : "Follow"}
            </button>
            <button type="button" onClick={() => navigate(`/chat/${profile.id}`)}>
              Message
            </button>
          </div>
        )}
      </section>

      <section>
        <h2>{profile.username}'s Folders</h2>
        {status && <p className="profile-status">{status}</p>}
        <div className="profile-grid">
          {folders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} onOpen={openFolder} onLike={toggleLike} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default UserProfile;
