import React, { useEffect, useRef, useState } from 'react';
import { FileUp, Mic, Square, Play, Upload } from 'lucide-react';
import { readAudioFile, recordAudio, playAudio } from '../utils/audio';
import { Modal } from './ui/Modal';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { Tabs, TabItem } from './ui/Tabs';
import { useMediaQuery } from '../hooks/useMediaQuery';
import styles from './AudioModal.module.css';

interface Props {
  onAssign: (dataUrl: string) => void;
  onCancel: () => void;
  existingAudio?: string;
}

export const AudioModal: React.FC<Props> = ({ onAssign, onCancel, existingAudio }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [tab, setTab] = useState<'file' | 'record'>('file');
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingAudio ?? null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<{ stop: () => Promise<string> } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      const rec = recorderRef.current;
      if (!rec) return;
      recorderRef.current = null;
      rec.stop().catch(() => {});
    };
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAudioFile(file);
      setPreview(dataUrl);
      setError(null);
    } catch {
      setError('Could not read audio file.');
    }
  };

  const startRecording = async () => {
    try {
      recorderRef.current = await recordAudio();
      setRecording(true);
      setError(null);
    } catch {
      setError('Microphone access denied.');
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      const dataUrl = await recorderRef.current.stop();
      setPreview(dataUrl);
      setError(null);
    } catch {
      setError('Could not save recording.');
    } finally {
      recorderRef.current = null;
      setRecording(false);
    }
  };

  const handlePreview = () => {
    if (preview) playAudio(preview).catch(() => setError('Playback failed.'));
  };

  const handleAssign = () => {
    if (preview) onAssign(preview);
  };

  const tabItems: TabItem[] = [
    {
      id: 'file',
      label: 'Upload',
      content: (
        <div className={styles.section}>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            onChange={handleFile}
            className={styles.fileInput}
          />
          <Button variant="secondary" fullWidth onClick={() => fileRef.current?.click()}>
            <FileUp size={18} aria-hidden />
            Choose audio file
          </Button>
        </div>
      ),
    },
    {
      id: 'record',
      label: 'Record',
      content: (
        <div className={styles.section}>
          {!recording ? (
            <Button variant="secondary" fullWidth onClick={startRecording}>
              <Mic size={18} aria-hidden />
              Start recording
            </Button>
          ) : (
            <Button variant="danger" fullWidth onClick={stopRecording}>
              <Square size={18} aria-hidden />
              Stop recording
            </Button>
          )}
          {recording && <p className={styles.hint}>Recording… tap Stop when done</p>}
        </div>
      ),
    },
  ];

  const body = (
    <>
      <Tabs items={tabItems} value={tab} onChange={(id) => setTab(id as 'file' | 'record')} className={styles.tabs} />

      {preview && (
        <div className={styles.previewSection}>
          <Button variant="link" onClick={handlePreview}>
            <Play size={16} aria-hidden />
            Preview
          </Button>
          <p className={styles.readyText}>Audio ready</p>
        </div>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={`${styles.actions} ${isMobile ? styles.actionsMobile : ''}`}>
        <Button variant="secondary" onClick={onCancel} fullWidth={isMobile}>Cancel</Button>
        <Button onClick={handleAssign} disabled={!preview} fullWidth={isMobile}>
          <Upload size={18} aria-hidden />
          Assign
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open title="Assign audio" onClose={onCancel}>
        {body}
      </Sheet>
    );
  }

  return (
    <Modal open title="Assign audio" onClose={onCancel}>
      {body}
    </Modal>
  );
};
