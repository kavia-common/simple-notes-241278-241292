import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Retro color palette for theme
const retroColors = {
  bg: '#212529',
  bgAccent: '#353740',
  card: '#E9E3CB',
  text: '#282623',
  textDim: '#726747',
  accent1: '#C78254',
  accent2: '#70A37F',
  border: '#C1BCBB',
  yellow: '#FFF86B',
  shadow: '#00000033'
};

// PUBLIC_INTERFACE
function App() {
  // State management
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [titleInput, setTitleInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [editing, setEditing] = useState(false);
  const titleRef = useRef(null);

  // ------- LocalStorage: Read/Write --------
  // Load notes from localStorage on mount
  useEffect(() => {
    // eslint-disable-next-line
    const saved = localStorage.getItem('retro_notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('retro_notes', JSON.stringify(notes));
  }, [notes]);

  // --------- Note CRUD Operations ----------

  // PUBLIC_INTERFACE
  function handleSelectNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setEditing(false);
    setCurrentNoteId(noteId);
    setTitleInput(note.title);
    setBodyInput(note.body);
  }

  // PUBLIC_INTERFACE
  function handleAddNote() {
    setEditing(true);
    setCurrentNoteId(null);
    setTitleInput('');
    setBodyInput('');
    setTimeout(() => titleRef.current && titleRef.current.focus(), 0);
  }

  // PUBLIC_INTERFACE
  function handleEditNote() {
    setEditing(true);
    setTimeout(() => titleRef.current && titleRef.current.focus(), 0);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(noteId) {
    if (!window.confirm('Delete this note?')) return;
    setNotes(notes.filter(n => n.id !== noteId));
    if (noteId === currentNoteId) {
      setCurrentNoteId(null);
      setEditing(false);
      setTitleInput('');
      setBodyInput('');
    }
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(e) {
    e && e.preventDefault();
    if (!titleInput.trim()) {
      alert('Title required.');
      return;
    }
    if (currentNoteId) {
      // Update
      setNotes(notes.map(n =>
        n.id === currentNoteId
          ? {...n, title: titleInput, body: bodyInput, updatedAt: new Date().toISOString() }
          : n
      ));
    } else {
      // Create
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      setNotes([
        {
          id,
          title: titleInput,
          body: bodyInput,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...notes
      ]);
      setCurrentNoteId(id);
    }
    setEditing(false);
  }

  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    if (currentNoteId) {
      const note = notes.find(n => n.id === currentNoteId);
      setTitleInput(note?.title || '');
      setBodyInput(note?.body || '');
      setEditing(false);
    } else {
      setTitleInput('');
      setBodyInput('');
      setEditing(false);
    }
  }

  // ----------- Search/Filter ---------------
  const filteredNotes = search.trim()
    ? notes.filter(
        n =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  // --------- Selected Note -----------------
  const selectedNote = currentNoteId
    ? notes.find(n => n.id === currentNoteId)
    : null;

  // ------------- UI Layout -----------------
  return (
    <div
      className="retro-app"
      style={{ background: retroColors.bg, color: retroColors.text }}
      data-testid="retro-notes-app"
    >
      <header className="retro-header">
        <span className="title-emoji" aria-label="Notes" role="img">
          📝
        </span>
        <span className="retro-title">Retro Notes</span>
        <span className="retro-subtitle">Minimal • Local • Fast</span>
      </header>
      <div className="retro-main">
        {/* Sidebar */}
        <aside className="retro-sidebar">
          <div className="sidebar-header">
            <button
              className="sidebar-add-btn"
              onClick={handleAddNote}
              title="Add New Note"
              aria-label="Add note"
              style={{
                background: retroColors.accent1,
                color: retroColors.card,
                borderColor: retroColors.border
              }}
            >
              ＋ New Note
            </button>
            <input
              className="sidebar-search"
              type="search"
              placeholder="Search notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search notes"
              style={{
                background: retroColors.card,
                color: retroColors.text,
                borderColor: retroColors.border
              }}
            />
          </div>
          <ul className="note-list" role="list">
            {filteredNotes.length === 0 && (
              <li className="note-list-empty">No notes found.</li>
            )}
            {filteredNotes.map(note => (
              <li
                key={note.id}
                className={`note-list-item${note.id === currentNoteId ? ' selected' : ''}`}
                onClick={() => handleSelectNote(note.id)}
                aria-current={note.id === currentNoteId ? 'true' : undefined}
              >
                <div className="note-title-row">
                  <span className="note-title">{note.title || <em>(Untitled)</em>}</span>
                  <button
                    className="note-del-btn"
                    title="Delete"
                    aria-label="Delete note"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
                <div className="note-snippet">
                  {note.body.length > 60
                    ? note.body.slice(0, 60) + '…'
                    : note.body}
                </div>
                <div className="note-meta">
                  {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {/* Main editor panel */}
        <section className="retro-editor">
          {/* Create/Edit Form */}
          {editing ? (
            <form className="editor-form" onSubmit={handleSaveNote}>
              <input
                ref={titleRef}
                className="editor-title"
                placeholder="Note title…"
                value={titleInput}
                maxLength={80}
                onChange={e => setTitleInput(e.target.value)}
                required
                autoFocus
                style={{ background: retroColors.card, color: retroColors.text }}
              />
              <textarea
                className="editor-body"
                placeholder="Type your note here…"
                value={bodyInput}
                onChange={e => setBodyInput(e.target.value)}
                rows={10}
                style={{ background: retroColors.card, color: retroColors.text }}
              ></textarea>
              <div className="editor-actions">
                <button
                  className="editor-save-btn"
                  type="submit"
                  style={{
                    background: retroColors.accent1,
                    color: retroColors.card,
                    borderColor: retroColors.accent1
                  }}
                >
                  💾 Save
                </button>
                <button
                  className="editor-cancel-btn"
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: retroColors.bgAccent,
                    color: retroColors.textDim,
                    borderColor: retroColors.border
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : selectedNote ? (
            <div className="editor-readonly">
              <div className="editor-title-bar">
                <div className="editor-readonly-title">{selectedNote.title}</div>
                <button
                  className="editor-edit-btn"
                  onClick={handleEditNote}
                  style={{ background: retroColors.accent2, color: retroColors.card }}
                >
                  ✎ Edit
                </button>
              </div>
              <div className="editor-readonly-body">
                {selectedNote.body.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="editor-readonly-meta">
                Last updated:{' '}
                {new Date(selectedNote.updatedAt || selectedNote.createdAt).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="editor-empty">
              <span>🡸 Select or add a note to start.</span>
            </div>
          )}
        </section>
      </div>
      <footer className="retro-footer">
        <span className="footer-left">Simple retro notes • Local storage only</span>
        <span className="footer-right">
          <a href="https://github.com/" rel="noopener noreferrer" target="_blank">
            GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
