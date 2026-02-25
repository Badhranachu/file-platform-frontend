import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./FolderCard.css";

function FolderCard({ folder, onOpen, onLike }) {
  const { user } = useContext(AuthContext);
  const canShowCounts = folder.is_public || Number(folder.owner_id) === Number(user?.id);

  return (
    <article className="folder-card" onClick={() => onOpen(folder)}>
      <div className="folder-card-head">
        <span className="folder-visibility">{folder.is_public ? "Public" : "Private"}</span>
        <span className="folder-code">{folder.folder_code}</span>
      </div>

      <h3>{folder.name}</h3>
      <p>{folder.description || "No description"}</p>

      {canShowCounts && (
        <div className="folder-stats">
          <span>Folders: {folder.subfolder_count}</span>
          <span>Files: {folder.file_count}</span>
          <span>Views: {folder.view_count}</span>
        </div>
      )}

      <div className="folder-stats">
        <span>Likes: {folder.like_count}</span>
        <span>Owner: {folder.owner_username}</span>
      </div>

      <div className="folder-actions" onClick={(e) => e.stopPropagation()}>
        {user && (
          <button type="button" onClick={() => onLike(folder)}>
            {folder.is_liked ? "Unlike" : "Like"}
          </button>
        )}
      </div>
    </article>
  );
}

export default FolderCard;
