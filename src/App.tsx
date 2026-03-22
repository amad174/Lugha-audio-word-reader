import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BoundingBox, AppMode, StoredPage } from './types';
import { useMappings } from './hooks/useMappings';
import { useAuth } from './hooks/useAuth';
import { PageViewer } from './components/PageViewer';
import { AudioModal } from './components/AudioModal';
import { Toolbar } from './components/Toolbar';
import { AdminLogin } from './components/AdminLogin';
import { loadPages, savePages, updatePageBoxes } from './utils/storage';
import { pdfToDataUrls } from './utils/pdf';
import './App.css';

function pageId(dataUrl: string): string {
  // Use a short hash of the data URL prefix as a stable page identifier
  let h = 5381;
  const sample = dataUrl.slice(0, 300);
  for (let i = 0; i < sample.length; i++) h = ((h << 5) + h) ^ sample.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function App() {
  const { mappings, assign } = useMappings();
  const { isAdmin, adminExists, loginAdmin, createAdmin, logout } = useAuth();

  const [pages, setPages] = useState<StoredPage[]>(() => loadPages());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mode, setMode] = useState<AppMode>('play');
  const [pendingBox, setPendingBox] = useState<BoundingBox | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [importing, setImporting] = useState<{ current: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPage = pages[currentIdx] ?? null;

  // Sync admin mode changes to default mode
  useEffect(() => {
    if (!isAdmin) setMode('play');
  }, [isAdmin]);

  // ── Page management ───────────────────────────────────────────────────────

  const goToPage = useCallback((idx: number) => {
    setCurrentIdx(Math.max(0, Math.min(pages.length - 1, idx)));
  }, [pages.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';

    const newPages: StoredPage[] = [];

    for (const file of files) {
      if (file.type === 'application/pdf') {
        const dataUrls = await pdfToDataUrls(file, 1.5, (cur, tot) =>
          setImporting({ current: cur, total: tot })
        );
        dataUrls.forEach((dataUrl, i) => {
          const id = pageId(dataUrl);
          // Preserve existing boxes if this page was imported before
          const existing = pages.find(p => p.id === id);
          newPages.push({ id, dataUrl, name: `${file.name} p${i + 1}`, boxes: existing?.boxes ?? [] });
        });
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        const id = pageId(dataUrl);
        const existing = pages.find(p => p.id === id);
        newPages.push({ id, dataUrl, name: file.name, boxes: existing?.boxes ?? [] });
      }
    }

    setImporting(null);
    setPages(prev => {
      // Merge: replace existing by id, append new
      const map = new Map(prev.map(p => [p.id, p]));
      newPages.forEach(p => map.set(p.id, p));
      const next = Array.from(map.values());
      savePages(next);
      return next;
    });
    if (pages.length === 0) setCurrentIdx(0);
  };

  // ── Box management ────────────────────────────────────────────────────────

  const handleBoxAdd = useCallback((box: BoundingBox) => {
    if (!currentPage) return;
    setPages(prev => {
      const next = updatePageBoxes(prev, currentPage.id, [
        ...prev.find(p => p.id === currentPage.id)!.boxes.filter(b => b.id !== box.id),
        box,
      ]);
      return next;
    });
    setPendingBox(box);
  }, [currentPage]);

  const handleBoxDelete = useCallback((id: string) => {
    if (!currentPage) return;
    setPages(prev => {
      const page = prev.find(p => p.id === currentPage.id)!;
      return updatePageBoxes(prev, currentPage.id, page.boxes.filter(b => b.id !== id));
    });
  }, [currentPage]);

  const handleBoxClick = useCallback((box: BoundingBox) => {
    setPendingBox(box);
  }, []);

  const handleAssign = useCallback((dataUrl: string) => {
    if (pendingBox) {
      assign(pendingBox.id, dataUrl);
      setPendingBox(null);
    }
  }, [pendingBox, assign]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleAdminToggle = () => {
    if (isAdmin) logout();
    else setShowLogin(true);
  };

  return (
    <div className="app">
      <Toolbar
        currentPage={currentIdx + 1}
        totalPages={Math.max(pages.length, 1)}
        mode={mode}
        mappings={mappings}
        isAdmin={isAdmin}
        onPrevPage={() => goToPage(currentIdx - 1)}
        onNextPage={() => goToPage(currentIdx + 1)}
        onSetMode={setMode}
        onImportPage={() => fileInputRef.current?.click()}
        onAdminToggle={handleAdminToggle}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <main className="main">
        {importing && (
          <div className="importProgress">
            Importing page {importing.current} of {importing.total}…
          </div>
        )}

        {currentPage ? (
          <PageViewer
            imageSrc={currentPage.dataUrl}
            mappings={mappings}
            mode={mode}
            boxes={currentPage.boxes}
            isAdmin={isAdmin}
            onBoxClick={handleBoxClick}
            onBoxAdd={handleBoxAdd}
            onBoxDelete={handleBoxDelete}
          />
        ) : (
          <EmptyState isAdmin={isAdmin} onImport={() => fileInputRef.current?.click()} onAdminLogin={() => setShowLogin(true)} />
        )}
      </main>

      {pendingBox && (
        <AudioModal
          onAssign={handleAssign}
          onCancel={() => setPendingBox(null)}
          existingAudio={mappings[pendingBox.id]}
        />
      )}

      {showLogin && (
        <AdminLogin
          adminExists={adminExists}
          onLogin={(pw) => { const ok = loginAdmin(pw); if (ok) setShowLogin(false); return ok; }}
          onCreate={(pw) => { createAdmin(pw); setShowLogin(false); }}
          onCancel={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ isAdmin, onImport, onAdminLogin }: {
  isAdmin: boolean; onImport: () => void; onAdminLogin: () => void;
}) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">📖</div>
      <h1 className="emptyTitle">Iqra Audio App</h1>

      {isAdmin ? (
        <>
          <p className="emptyDesc">Import the Iqra PDF or page images to get started.</p>
          <button className="importBtn" onClick={onImport}>Import PDF / Images</button>
          <div className="howItWorks">
            <h3>Admin setup</h3>
            <ol>
              <li>Import PDF or images <strong>(📄)</strong></li>
              <li>Use <strong>✒️ Draw</strong> — drag over each letter/word</li>
              <li>Record or upload audio for each box</li>
              <li>Kids tap boxes in <strong>▶ Play</strong> mode to listen</li>
            </ol>
          </div>
        </>
      ) : (
        <>
          <p className="emptyDesc">No pages loaded yet. Ask your teacher to set up the app.</p>
          <button className="loginHintBtn" onClick={onAdminLogin}>🔐 Teacher login</button>
        </>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target!.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default App;
