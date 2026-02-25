import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import "./ChatRoom.css";

function ChatRoom() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const sessionUser = useMemo(() => JSON.parse(sessionStorage.getItem("user") || "null"), []);
  const endRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [peer, setPeer] = useState(null);

  const load = async () => {
    try {
      const [msgs, peerRes] = await Promise.all([
        api.get(`accounts/chats/${userId}/`),
        api.get(`accounts/users/${userId}/`),
      ]);
      setMessages(Array.isArray(msgs.data) ? msgs.data : []);
      setPeer(peerRes.data);
    } catch {
      setStatus("Could not load conversation.");
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      load();
    }, 3500);
    return () => clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const res = await api.post(`accounts/chats/${userId}/`, { text: text.trim() });
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch {
      setStatus("Could not send message.");
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-room-page">
      <header className="chat-room-header">
        <button type="button" className="chat-back" onClick={() => navigate("/chat")}>Back</button>

        <button type="button" className="chat-peer" onClick={() => navigate(`/users/${userId}`)}>
          {peer?.profile_photo ? (
            <img src={peer.profile_photo} alt={peer.username} className="chat-peer-avatar" />
          ) : (
            <div className="chat-peer-avatar chat-peer-fallback">
              {(peer?.username || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <strong>@{peer?.username || `user-${userId}`}</strong>
            <span>{peer?.email || ""}</span>
          </div>
        </button>
      </header>

      {status && <p className="chat-room-status">{status}</p>}

      <div className="chat-room-list">
        {messages.map((msg) => {
          const mine = Number(msg.sender) === Number(sessionUser?.id);
          return (
            <div key={msg.id} className={`chat-room-item ${mine ? "mine" : "theirs"}`}>
              <p>{msg.text}</p>
              <small>{formatTime(msg.created_at)}</small>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="chat-room-form">
        <textarea
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button type="button" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatRoom;
