import React, { useState, useCallback, useRef } from 'react';
import { BoundingBox, AppMode } from './types';
import { useMappings } from './hooks/useMappings';
import { PageViewer } from './components/PageViewer';
import { AudioModal } from './components/AudioModal';
import { Toolbar } from './components/Toolbar';
import { importMappings } from './utils/storage';
import './App.css';

function App() {
  const { mappings, assign, reload } = useMappings();

  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState<AppMode>('draw');
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [pendingBox, setPendingBox] = useState<BoundingBox | null>(null);

  const pageInputRef = useRef<HTMLInputElement>(null);
  const mappingsInputRef = useRef<HTMLInputElement>(null);

  const currentImage = pages[currentPage] ?? null;

  // Reset boxes when page changes
  const goToPage = useCallback((idx: number) => {
    setCurrentPage(idx);
    setBoxes([]);
  }, []);

  const handleBoxAdd = useCallback((box: BoundingBox) => {
    setBoxes(prev => [...prev.filter(b => b.id !== box.id), box]);
    setPendingBox(box); // immediately open audio assignment
  }, []);

  const handleBoxClick = useCallback((box: BoundingBox) => {
    setPendingBox(box);
  }, []);

  const handleAssign = useCallback((dataUrl: string) => {
    if (pendingBox) {
      assign(pendingBox.id, dataUrl);
      setPendingBox(null);
    }
  }, [pendingBox, assign]);

  const handlePageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPages = Array.from(files).map(f => URL.createObjectURL(f));
    setPages(prev => {
      const next = [...prev, ...newPages];
      if (prev.length === 0) { setCurrentPage(0); setBoxes([]); }
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
        onPrevPage={() => goToPage(Math.max(0, currentPage - 1))}
        onNextPage={() => goToPage(Math.min(pages.length - 1, currentPage + 1))}
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
            boxes={boxes}
            onBoxClick={handleBoxClick}
            onBoxAdd={handleBoxAdd}
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
          <li>Use <strong>✒️ Draw</strong> — drag over a word or letter</li>
          <li>Assign audio by uploading a file or recording</li>
          <li>Use <strong>▶ Play</strong> — tap any box to hear it</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
