import { createContext, useMemo, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(sessionStorage.getItem("user") || "null")
  );

  const login = async (email, password) => {
    const tokenRes = await api.post("token/", { email, password });

    sessionStorage.setItem("access", tokenRes.data.access);
    sessionStorage.setItem("refresh", tokenRes.data.refresh);

    const profileRes = await api.get("accounts/profile/");
    sessionStorage.setItem("user", JSON.stringify(profileRes.data));
    setUser(profileRes.data);

    return profileRes.data;
  };

  const logout = () => {
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout, setUser }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
