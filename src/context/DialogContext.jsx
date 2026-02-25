import { createContext, useCallback, useContext, useMemo, useState } from "react";
import "./DialogContext.css";

const DialogContext = createContext(null);

function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const closeDialog = useCallback((result) => {
    setDialog((active) => {
      if (active?.resolve) active.resolve(result);
      return null;
    });
    setInputValue("");
  }, []);

  const alert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        type: "alert",
        title: options.title || "Notice",
        message,
        confirmText: options.confirmText || "OK",
        resolve,
      });
    });
  }, []);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        type: "confirm",
        title: options.title || "Please confirm",
        message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setInputValue(options.defaultValue || "");
      setDialog({
        type: "prompt",
        title: options.title || "Input required",
        message,
        placeholder: options.placeholder || "Type here...",
        confirmText: options.confirmText || "Submit",
        cancelText: options.cancelText || "Cancel",
        resolve,
      });
    });
  }, []);

  const api = useMemo(() => ({ alert, confirm, prompt }), [alert, confirm, prompt]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog && (
        <div className="dialog-overlay" onClick={() => closeDialog(dialog.type === "alert" ? true : null)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <h3>{dialog.title}</h3>
            <p>{dialog.message}</p>

            {dialog.type === "prompt" && (
              <input
                type="text"
                className="dialog-input"
                value={inputValue}
                placeholder={dialog.placeholder}
                autoFocus
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") closeDialog(inputValue.trim() || null);
                }}
              />
            )}

            <div className="dialog-actions">
              {dialog.type !== "alert" && (
                <button type="button" className="dialog-btn ghost" onClick={() => closeDialog(dialog.type === "confirm" ? false : null)}>
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                className="dialog-btn"
                onClick={() => {
                  if (dialog.type === "confirm") {
                    closeDialog(true);
                    return;
                  }
                  if (dialog.type === "prompt") {
                    closeDialog(inputValue.trim() || null);
                    return;
                  }
                  closeDialog(true);
                }}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used inside DialogProvider");
  return context;
}

export { DialogProvider, useDialog };
