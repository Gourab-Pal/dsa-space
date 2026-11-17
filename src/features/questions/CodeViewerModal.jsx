import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";

// The native modal keeps keyboard focus inside the viewer and makes the page
// behind it inert. Portaling avoids the narrow sidebar's layout and clipping.
export function CodeViewerModal({ children, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    closeRef.current.focus();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="code-viewer-modal"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        // My Questions also listens for Escape. Close just this viewer first.
        if (event.key === "Escape") event.stopPropagation();
      }}
      onCancel={(event) => {
        event.preventDefault(); event.stopPropagation(); onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="code-viewer-heading">
        <h2 id={titleId}>Code viewer</h2>
        <button ref={closeRef} type="button" className="icon-button"
          aria-label="Close code viewer" title="Close (Escape)" onClick={onClose}>
          <X size={23} />
        </button>
      </header>
      <div className="code-viewer-body">{children}</div>
    </dialog>,
    document.body,
  );
}
