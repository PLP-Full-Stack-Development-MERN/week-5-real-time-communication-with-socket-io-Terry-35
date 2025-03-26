import React from "react";

export const NoteEditor = ({ content, onChange }) => {
  return (
    <div className="note-editor">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your note..."
        rows={20}
        cols={80}
      />
    </div>
  );
};