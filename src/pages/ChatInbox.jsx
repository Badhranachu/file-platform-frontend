import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./ChatInbox.css";

function ChatInbox() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");

  const loadChats = async () => {
    try {
      const res = await api.get("accounts/chats/");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStatus("Could not load chats.");
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-inbox-page">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>Back</button>
      <div className="chat-inbox-head">
        <h1>Messages</h1>
        <p>Direct chats with people you connect with.</p>
      </div>

      {status && <p className="chat-inbox-status">{status}</p>}

      <div className="chat-inbox-list">
        {items.map((item) => (
          <button
            type="button"
            key={item.user.id}
            className="chat-inbox-item"
            onClick={() => navigate(`/chat/${item.user.id}`)}
          >
            <div className="chat-inbox-user">
              {item.user.profile_photo ? (
                <img src={item.user.profile_photo} alt={item.user.username} className="chat-inbox-avatar" />
              ) : (
                <div className="chat-inbox-avatar chat-inbox-avatar-fallback">
                  {(item.user.username || "U").slice(0, 1).toUpperCase()}
                </div>
              )}

              <div>
                <strong>@{item.user.username}</strong>
                <p>{item.user.email}</p>
              </div>
            </div>

            <div className="chat-inbox-meta">
              <span>{item.last_message}</span>
              <small>{formatTime(item.last_message_at)}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ChatInbox;
