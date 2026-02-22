import { createContext, useState, useEffect } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const login = async (username, password) => {
    // 1️⃣ Get tokens
    const res = await api.post("token/", { username, password });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);

    // 2️⃣ Fetch profile
    const profileRes = await api.get("accounts/profile/");

    // 3️⃣ Save user
    localStorage.setItem("user", JSON.stringify(profileRes.data));
    setUser(profileRes.data);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};