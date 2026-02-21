import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Dashboard from "./pages/Dashboard";
import FolderView from "./pages/FolderView";
import FileView from "./pages/FileView";
import Navbar from "./components/Navbar";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Navbar/>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/folder/:id" element={<FolderView />} />
          <Route path="/file/:id" element={<FileView />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;