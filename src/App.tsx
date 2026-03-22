import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BoundingBox, AppMode, StoredPage, AudioMapping } from './types';
import { useAuth } from './hooks/useAuth';
import { PageViewer } from './components/PageViewer';
import { AudioModal } from './components/AudioModal';
import { Toolbar } from './components/Toolbar';
import { AdminLogin } from './components/AdminLogin';
import { AdminMenu } from './components/AdminMenu';
import { dbGetPages, dbSavePages, dbGetMappings, dbSaveMappings, migrateFromLocalStorage } from './utils/db';
import { exportBundle, importBundle } from './utils/storage';
import { pdfToDataUrls } from './utils/pdf';
import './App.css';

function pageId(dataUrl: string): string {
  let h = 5381;
  const sample = dataUrl.slice(0, 300);
  for (let i = 0; i < sample.length; i++) h = ((h << 5) + h) ^ sample.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function App() {
  const { isAdmin, adminExists, loginAdmin, createAdmin, logout } = useAuth();

  const [pages, setPages] = useState<StoredPage[]>([]);
  const [mappings, setMappings] = useState<AudioMapping>({});
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mode, setMode] = useState<AppMode>('play');
  const [pendingBox, setPendingBox] = useState<BoundingBox | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [importing, setImporting] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageFileRef = useRef<HTMLInputElement>(null);
  const bundleFileRef = useRef<HTMLInputElement>(null);
  const currentPage = pages[currentIdx] ?? null;

  // ── Load from IndexedDB on mount ──────────────────────────────────────────

  useEffect(() => {
    migrateFromLocalStorage()
      .then(() => Promise.all([dbGetPages(), dbGetMappings()]))
      .then(([p, m]) => { setPages(p); setMappings(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (!isAdmin) setMode('play'); }, [isAdmin]);

  const goToPage = useCallback((idx: number) => {
    setCurrentIdx(Math.max(0, Math.min(pages.length - 1, idx)));
  }, [pages.length]);

  // ── Page import (PDF / images) ────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    const newPages: StoredPage[] = [];

    for (const file of files) {
      if (file.type === 'application/pdf') {
        const urls = await pdfToDataUrls(file, 1.5, (cur, tot) =>
          setImporting({ current: cur, total: tot })
        );
        urls.forEach((url, i) => {
          const id = pageId(url);
          const existing = pages.find(p => p.id === id);
          newPages.push({ id, dataUrl: url, name: `${file.name} p${i + 1}`, boxes: existing?.boxes ?? [] });
        });
      } else {
        const url = await readFileAsDataUrl(file);
        const id = pageId(url);
        const existing = pages.find(p => p.id === id);
        newPages.push({ id, dataUrl: url, name: file.name, boxes: existing?.boxes ?? [] });
      }
    }

    setImporting(null);
    setPages(prev => {
      const map = new Map(prev.map(p => [p.id, p]));
      newPages.forEach(p => map.set(p.id, p));
      const next = Array.from(map.values());
      dbSavePages(next).catch(console.error);
      return next;
    });
    if (pages.length === 0) setCurrentIdx(0);
  };

  // ── Page delete ───────────────────────────────────────────────────────────

  const handleDeletePage = useCallback(() => {
    if (!currentPage) return;
    const deletedId = currentPage.id;
    setPages(prev => {
      const next = prev.filter(p => p.id !== deletedId);
      dbSavePages(next).catch(console.error);
      return next;
    });
    setCurrentIdx(i => Math.max(0, i - 1));
  }, [currentPage]);

  // ── Box management ────────────────────────────────────────────────────────

  const handleBoxAdd = useCallback((box: BoundingBox) => {
    if (!currentPage) return;
    setPages(prev => {
      const page = prev.find(p => p.id === currentPage.id)!;
      const updated = { ...page, boxes: [...page.boxes.filter(b => b.id !== box.id), box] };
      const next = prev.map(p => p.id === currentPage.id ? updated : p);
      dbSavePages(next).catch(console.error);
      return next;
    });
    setPendingBox(box);
  }, [currentPage]);

  const handleBoxDelete = useCallback((id: string) => {
    if (!currentPage) return;
    setPages(prev => {
      const page = prev.find(p => p.id === currentPage.id)!;
      const updated = { ...page, boxes: page.boxes.filter(b => b.id !== id) };
      const next = prev.map(p => p.id === currentPage.id ? updated : p);
      dbSavePages(next).catch(console.error);
      return next;
    });
  }, [currentPage]);

  const handleBoxClick = useCallback((box: BoundingBox) => {
    setPendingBox(box);
  }, []);

  const handleAssign = useCallback((dataUrl: string) => {
    if (!pendingBox) return;
    setMappings(prev => {
      const next = { ...prev, [pendingBox.id]: dataUrl };
      dbSaveMappings(next).catch(console.error);
      return next;
    });
    setPendingBox(null);
  }, [pendingBox]);

  // ── Bundle export / import ────────────────────────────────────────────────

  const handleExportBundle = useCallback(() => {
    exportBundle(pages, mappings);
  }, [pages, mappings]);

  const handleBundleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { pages: p, mappings: m } = await importBundle(file);
      await dbSavePages(p);
      await dbSaveMappings(m);
      setPages(p);
      setMappings(m);
      setCurrentIdx(0);
      setShowAdminMenu(false);
    } catch {
      setError('Could not load bundle — make sure it is a valid Iqra bundle file.');
    }
  };

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleAdminToggle = () => {
    if (isAdmin) logout();
    else setShowLogin(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="loadingScreen">
        <div className="loadingSpinner" />
      </div>
    );
  }

  return (
    <div className="app">
      <Toolbar
        currentPage={currentIdx + 1}
        totalPages={Math.max(pages.length, 1)}
        mode={mode}
        isAdmin={isAdmin}
        onPrevPage={() => goToPage(currentIdx - 1)}
        onNextPage={() => goToPage(currentIdx + 1)}
        onSetMode={setMode}
        onImportPage={() => pageFileRef.current?.click()}
        onAdminMenu={() => setShowAdminMenu(true)}
        onAdminToggle={handleAdminToggle}
      />

      <input
        ref={pageFileRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        ref={bundleFileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleBundleFileChange}
      />

      <main className="main">
        {importing && (
          <div className="importProgress">
            Importing page {importing.current} of {importing.total}…
          </div>
        )}
        {error && (
          <div className="errorBanner" onClick={() => setError(null)}>
            {error} <span className="errorDismiss">✕</span>
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
          <EmptyState
            isAdmin={isAdmin}
            onImport={() => pageFileRef.current?.click()}
            onImportBundle={() => bundleFileRef.current?.click()}
            onAdminLogin={() => setShowLogin(true)}
          />
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

      {showAdminMenu && (
        <AdminMenu
          hasPages={pages.length > 0}
          hasContent={pages.length > 0 || Object.keys(mappings).length > 0}
          onImportBundle={() => bundleFileRef.current?.click()}
          onExportBundle={handleExportBundle}
          onDeletePage={handleDeletePage}
          onClose={() => setShowAdminMenu(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ isAdmin, onImport, onImportBundle, onAdminLogin }: {
  isAdmin: boolean;
  onImport: () => void;
  onImportBundle: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">📖</div>
      <h1 className="emptyTitle">Iqra Audio App</h1>

      {isAdmin ? (
        <>
          <p className="emptyDesc">Import the Iqra PDF or load a saved bundle to get started.</p>
          <button className="importBtn" onClick={onImport}>Import PDF / Images</button>
          <button className="secondaryBtn" onClick={onImportBundle}>📥 Load Bundle</button>
          <div className="howItWorks">
            <h3>Admin setup</h3>
            <ol>
              <li>Import PDF or images <strong>(📄)</strong></li>
              <li>Use <strong>✒️ Draw</strong> — drag over each letter/word</li>
              <li>Record or upload audio for each box</li>
              <li>Export bundle via <strong>⚙️</strong> to share with kids</li>
              <li>Kids load the bundle and tap boxes to listen</li>
            </ol>
          </div>
        </>
      ) : (
        <>
          <p className="emptyDesc">Load a bundle from your teacher to start listening.</p>
          <button className="importBtn" onClick={onImportBundle}>📥 Load Bundle</button>
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
