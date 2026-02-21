import { useState } from "react";
import api from "../api/axios";

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    is_public: true,
    public_password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("accounts/register/", form);
    alert("Registered successfully");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username"
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />

      <input
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <label>
        Public Account?
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={(e) =>
            setForm({ ...form, is_public: e.target.checked })
          }
        />
      </label>

      {!form.is_public && (
        <input
          type="password"
          placeholder="Public Access Password"
          onChange={(e) =>
            setForm({ ...form, public_password: e.target.value })
          }
        />
      )}

      <button type="submit">Register</button>
    </form>
  );
}

export default Register;