import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const dialog = useDialog();

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [folderCount, setFolderCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoggedIn = useMemo(
    () => !!sessionStorage.getItem("access") && !!user,
    [user]
  );

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.get(`folders/?search=${encodeURIComponent(searchTerm)}`);
        setSuggestions(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (!isLoggedIn) {
      setFolderCount(0);
      setLikedCount(0);
      return;
    }

    const loadCounts = async () => {
      try {
        const [mineRes, likedRes] = await Promise.all([
          api.get("folders/my_folders/"),
          api.get("folders/liked/"),
        ]);
        setFolderCount(Array.isArray(mineRes.data) ? mineRes.data.length : 0);
        setLikedCount(Array.isArray(likedRes.data) ? likedRes.data.length : 0);
      } catch {
        setFolderCount(0);
        setLikedCount(0);
      }
    };

    loadCounts();
  }, [isLoggedIn]);

  const handleSuggestionClick = async (folder) => {
    setSearchTerm("");
    setSuggestions([]);
    setMenuOpen(false);

    if (folder.is_public) {
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

  return (
    <header className="nav-shell">
      <div className="nav-content">
        <div className="nav-top-row">
          <div className="nav-brand" onClick={() => navigate("/")}>Edu Drive</div>

          <button
            type="button"
            className="nav-menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {isLoggedIn && (
          <div className={`nav-search-wrap ${menuOpen ? "open" : ""}`}>
            <input
              className="nav-search"
              placeholder="Search by folder name or code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {suggestions.length > 0 && (
              <div className="nav-suggestions">
                {suggestions.map((folder) => (
                  <button
                    type="button"
                    key={folder.id}
                    className="nav-suggestion-item"
                    onClick={() => handleSuggestionClick(folder)}
                  >
                    <span>{folder.is_public ? "Public" : "Private"}</span>
                    <span>{folder.name}</span>
                    <span>{folder.folder_code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isLoggedIn && (
          <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Feed</Link>
            <Link to="/following" onClick={() => setMenuOpen(false)}>Following</Link>
            <Link to="/chat" onClick={() => setMenuOpen(false)}>Chat</Link>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link to="/liked" onClick={() => setMenuOpen(false)}>Liked</Link>
          </nav>
        )}

        <div className={`nav-auth ${menuOpen ? "open" : ""}`}>
          {!isLoggedIn && (
            <>
              <button type="button" onClick={() => navigate("/login")}>Login</button>
              <button type="button" onClick={() => navigate("/register")}>Register</button>
            </>
          )}

          {isLoggedIn && (
            <div className="nav-profile">
              <button
                type="button"
                className="nav-profile-head"
                onClick={() => {
                  navigate(`/users/${user?.id}`);
                  setMenuOpen(false);
                }}
              >
                {user?.profile_photo ? (
                  <img src={user.profile_photo} alt="profile" className="nav-avatar" />
                ) : (
                  <div className="nav-avatar nav-avatar-fallback">
                    {(user?.username || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="nav-profile-meta">
                  <strong>{user?.username}</strong>
                  <span>Folders: {folderCount}</span>
                  <span>Liked: {likedCount}</span>
                </div>
              </button>

              <button
                type="button"
                className="nav-logout"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
