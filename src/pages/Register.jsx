import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!form.username.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get("accounts/username-suggestions/", {
          params: { username: form.username.trim() },
        });
        setSuggestions(Array.isArray(res.data?.suggestions) ? res.data.suggestions : []);
      } catch {
        setSuggestions([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [form.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("accounts/register/", form);
      navigate("/login");
    } catch (err) {
      const data = err?.response?.data;
      if (data?.username?.[0]) {
        setError(data.username[0]);
      } else if (data?.email?.[0]) {
        setError(data.email[0]);
      } else {
        setError("Registration failed. Try a different username or email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Username"
          required
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        {suggestions.length > 0 && (
          <div className="register-suggestions">
            {suggestions.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => setForm((prev) => ({ ...prev, username: name }))}
              >
                @{name}
              </button>
            ))}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p className="register-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
    </div>
  );
}

export default Register;
