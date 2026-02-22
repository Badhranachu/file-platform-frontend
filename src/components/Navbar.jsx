import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("access");

  // 🔎 Search debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(() => {
      api.get(`folders/?search=${searchTerm}`)
        .then(res => {
          setSuggestions(res.data);
          setShowSuggestions(true);
        })
        .catch(() => setSuggestions([]));
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  // 👤 Load user
  useEffect(() => {
    if (token) {
      api.get("accounts/profile/")
        .then(res => setUser(res.data))
        .catch(() => setUser(null));
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
    navigate("/login");
  };

  const styles = {
  navbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "#111827",
    color: "white",
    position: "relative",
    flexWrap: "wrap"
  },

  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  mobileToggle: {
    display: "none",
    fontSize: "22px",
    cursor: "pointer"
  },

  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },

  mobileOpen: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginTop: "10px"
  },

  searchWrapper: {
    position: "relative"
  },

  searchInput: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    outline: "none",
    width: "220px"
  },

  suggestionBox: {
    position: "absolute",
    top: "42px",
    left: 0,
    width: "100%",
    background: "white",
    color: "black",
    borderRadius: "6px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    maxHeight: "250px",
    overflowY: "auto",
    zIndex: 1000
  },

  suggestionItem: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee"
  },

  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%"
  },

  logoutBtn: {
    padding: "6px 12px",
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer"
  },

  loginBtn: {
    padding: "6px 12px",
    background: "#2563eb",
    border: "none",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer"
  },

  registerBtn: {
    padding: "6px 12px",
    background: "#10b981",
    border: "none",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer"
  }
};

  return (
    <nav style={styles.navbar}>
      {/* LEFT LOGO */}
      <div style={styles.logo} onClick={() => navigate("/")}>
        📁 FilePlatform
      </div>

      {/* MOBILE MENU BUTTON */}
      <div
        style={styles.mobileToggle}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        ☰
      </div>

      {/* CENTER + RIGHT CONTENT */}
      <div
        style={{
          ...styles.rightSection,
          ...(mobileMenuOpen ? styles.mobileOpen : {})
        }}
      >
        {/* SEARCH */}
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div style={styles.suggestionBox}>
              {suggestions.map((folder) => (
                <div
                  key={folder.id}
                  style={styles.suggestionItem}
                  onClick={async () => {
                    setSearchTerm("");
                    setShowSuggestions(false);
                    setMobileMenuOpen(false);

                    if (folder.is_public) {
                      navigate(`/folder/${folder.id}`);
                      return;
                    }

                    const password = prompt("Enter folder password:");
                    if (!password) return;

                    try {
                      await api.get(`folders/${folder.id}/`, {
                        params: { password }
                      });
                      navigate(`/folder/${folder.id}?password=${encodeURIComponent(password)}`);
                    } catch {
                      alert("Wrong password.");
                    }
                  }}
                >
                  {folder.is_public ? "📁" : "🔒"} {folder.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* USER SECTION */}
        {user ? (
          <div style={styles.userSection}>
            {user.profile_photo && (
              <img
                src={`http://localhost:8000${user.profile_photo}`}
                alt="profile"
                style={styles.avatar}
              />
            )}
            <span>{user.username}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div style={styles.userSection}>
            <button style={styles.loginBtn} onClick={() => navigate("/login")}>
              Login
            </button>
            <button style={styles.registerBtn} onClick={() => navigate("/register")}>
              Register
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;