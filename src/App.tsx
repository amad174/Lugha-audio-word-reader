import React, { useState, useCallback, useRef } from 'react';
import { BoundingBox, AppMode } from './types';
import { useOpenCV } from './hooks/useOpenCV';
import { useMappings } from './hooks/useMappings';
import { PageViewer } from './components/PageViewer';
import { AudioModal } from './components/AudioModal';
import { Toolbar } from './components/Toolbar';
import { importMappings } from './utils/storage';
import './App.css';

function App() {
  const { ready: cvReady } = useOpenCV();
  const { mappings, assign, reload } = useMappings();

  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState<AppMode>('play');
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
        // After drawing a box and assigning audio, drop back to play mode
        setMode(m => m === 'draw' ? 'play' : m);
      }
    },
    [pendingBox, assign]
  );

  const handlePageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPages = Array.from(files).map(f => URL.createObjectURL(f));
    setPages(prev => {
      const next = [...prev, ...newPages];
      if (prev.length === 0) setCurrentPage(0);
      return next;
    });
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
        mode={mode}
        mappings={mappings}
        cvReady={cvReady}
        onPrevPage={() => setCurrentPage(p => Math.max(0, p - 1))}
        onNextPage={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
        onSetMode={setMode}
        onImportPage={() => pageInputRef.current?.click()}
      />

      <input ref={pageInputRef} type="file" accept="image/*" multiple
        style={{ display: 'none' }} onChange={handlePageFileChange} />
      <input ref={mappingsInputRef} type="file" accept=".json"
        style={{ display: 'none' }} onChange={handleImportMappings} />

      <main className="main">
        {currentImage ? (
          <PageViewer
            imageSrc={currentImage}
            mappings={mappings}
            mode={mode}
            onBoxClick={handleBoxClick}
          />
        ) : (
          <EmptyState onImport={() => pageInputRef.current?.click()} />
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
      <p className="emptyDesc">Import Iqra book page images to get started.</p>
      <button className="importBtn" onClick={onImport}>Import Page Image</button>
      <div className="howItWorks">
        <h3>How it works</h3>
        <ol>
          <li>Import a page image <strong>(📄)</strong></li>
          <li>Use <strong>✏️ Assign</strong> — tap a detected box to assign audio</li>
          <li>Use <strong>✒️ Draw</strong> — drag to create your own box</li>
          <li>Use <strong>▶ Play</strong> — tap to hear audio</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
