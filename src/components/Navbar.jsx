import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("access");

  useEffect(() => {
    if (token) {
      api.get("accounts/profile/")
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          setUser(null);
        });
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        background: "#111827",
        color: "white"
      }}
    >
      {/* Left Side */}
      <h2
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        📁 FilePlatform
      </h2>

      {/* Right Side */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {user ? (
          <>
            {user.profile_photo && (
              <img
                src={`http://localhost:8000${user.profile_photo}`}
                alt="profile"
                width="35"
                height="35"
                style={{ borderRadius: "50%" }}
              />
            )}

            <span>{user.username}</span>

            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                background: "#ef4444",
                border: "none",
                color: "white",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "6px 12px",
                background: "#2563eb",
                border: "none",
                color: "white",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Login
            </button>

            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "6px 12px",
                background: "#10b981",
                border: "none",
                color: "white",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;