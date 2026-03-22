import React, { useState, useCallback, useRef } from 'react';
import { BoundingBox } from './types';
import { useOpenCV } from './hooks/useOpenCV';
import { useMappings } from './hooks/useMappings';
import { PageViewer } from './components/PageViewer';
import { AudioModal } from './components/AudioModal';
import { Toolbar } from './components/Toolbar';
import { importMappings } from './utils/storage';
import './App.css';

// Built-in demo pages – user can add their own via the 📄 button
const DEFAULT_PAGES: string[] = [
  // Placeholder – users import their own Iqra page images
];

function App() {
  const { ready: cvReady } = useOpenCV();
  const { mappings, assign, reload } = useMappings();

  const [pages, setPages] = useState<string[]>(DEFAULT_PAGES);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [pendingBox, setPendingBox] = useState<BoundingBox | null>(null);

  const pageInputRef = useRef<HTMLInputElement>(null);
  const mappingsInputRef = useRef<HTMLInputElement>(null);

  const currentImage = pages[currentPage] ?? null;

  const handleBoxClick = useCallback((box: BoundingBox) => {
    setPendingBox(box);
  }, []);

  const handleAssign = useCallback(
    (dataUrl: string) => {
      if (pendingBox) {
        assign(pendingBox.id, dataUrl);
        setPendingBox(null);
      }
    },
    [pendingBox, assign]
  );

  const handleImportPage = () => {
    pageInputRef.current?.click();
  };

  const handlePageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPages = Array.from(files).map((f) => URL.createObjectURL(f));
    setPages((prev) => [...prev, ...newPages]);
    if (pages.length === 0) setCurrentPage(0);
    e.target.value = '';
  };

  const handleImportMappings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importMappings(file).then(reload).catch(console.error);
    e.target.value = '';
  };

  return (
    <div className="app">
      <Toolbar
        currentPage={currentPage + 1}
        totalPages={Math.max(pages.length, 1)}
        isAssignMode={isAssignMode}
        mappings={mappings}
        cvReady={cvReady}
        onPrevPage={() => setCurrentPage((p) => Math.max(0, p - 1))}
        onNextPage={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
        onToggleMode={() => setIsAssignMode((m) => !m)}
        onImportPage={handleImportPage}
      />

      {/* Hidden file inputs */}
      <input
        ref={pageInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handlePageFileChange}
      />
      <input
        ref={mappingsInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportMappings}
      />

      <main className="main">
        {currentImage ? (
          <PageViewer
            imageSrc={currentImage}
            mappings={mappings}
            onBoxClick={handleBoxClick}
            isAssignMode={isAssignMode}
          />
        ) : (
          <EmptyState onImport={handleImportPage} />
        )}
      </main>

      {pendingBox && (
        <AudioModal
          onAssign={handleAssign}
          onCancel={() => setPendingBox(null)}
          existingAudio={mappings[pendingBox.id]}
        />
      )}
    </div>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">📖</div>
      <h1 className="emptyTitle">Iqra Audio App</h1>
      <p className="emptyDesc">
        Import Iqra book page images to get started.
        <br />
        Tap a letter to assign or play audio.
      </p>
      <button className="importBtn" onClick={onImport}>
        Import Page Image
      </button>
      <div className="howItWorks">
        <h3>How it works</h3>
        <ol>
          <li>Import a page image (📄)</li>
          <li>Switch to <strong>Assign</strong> mode (✏️)</li>
          <li>Tap any letter → assign audio</li>
          <li>Switch to <strong>Play</strong> mode (▶) to listen</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
