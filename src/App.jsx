import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { DialogProvider } from "./context/DialogContext";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import FileView from "./pages/FileView";
import FolderView from "./pages/FolderView";
import FollowingFeed from "./pages/FollowingFeed";
import ChatInbox from "./pages/ChatInbox";
import ChatRoom from "./pages/ChatRoom";
import LikedFolders from "./pages/LikedFolders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";

function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/folder/:id"
            element={
              <ProtectedRoute>
                <FolderView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/file/:id"
            element={
              <ProtectedRoute>
                <FileView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/liked"
            element={
              <ProtectedRoute>
                <LikedFolders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/following"
            element={
              <ProtectedRoute>
                <FollowingFeed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:userId"
            element={
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            }
          />
          </Routes>
        </BrowserRouter>
      </DialogProvider>
    </AuthProvider>
  );
}

export default App;
