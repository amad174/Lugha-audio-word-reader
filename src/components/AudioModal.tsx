import React, { useRef, useState } from 'react';
import { readAudioFile, recordAudio, playAudio } from '../utils/audio';
import styles from './AudioModal.module.css';

interface Props {
  onAssign: (dataUrl: string) => void;
  onCancel: () => void;
  existingAudio?: string;
}

type Tab = 'file' | 'record';

export const AudioModal: React.FC<Props> = ({ onAssign, onCancel, existingAudio }) => {
  const [tab, setTab] = useState<Tab>('file');
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingAudio ?? null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<{ stop: () => Promise<string> } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    const dataUrl = await recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
    setPreview(dataUrl);
  };

  const handlePreview = () => {
    if (preview) playAudio(preview).catch(() => setError('Playback failed.'));
  };

  const handleAssign = () => {
    if (preview) onAssign(preview);
  };

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Assign Audio</h2>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'file' ? styles.active : ''}`}
            onClick={() => setTab('file')}
          >
            Upload File
          </button>
          <button
            className={`${styles.tab} ${tab === 'record' ? styles.active : ''}`}
            onClick={() => setTab('record')}
          >
            Record
          </button>
        </div>

        <div className={styles.content}>
          {tab === 'file' && (
            <div className={styles.fileSection}>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                onChange={handleFile}
                className={styles.fileInput}
              />
              <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                Choose Audio File
              </button>
            </div>
          )}

          {tab === 'record' && (
            <div className={styles.recordSection}>
              {!recording ? (
                <button className={styles.recordBtn} onClick={startRecording}>
                  🎙 Start Recording
                </button>
              ) : (
                <button className={`${styles.recordBtn} ${styles.recording}`} onClick={stopRecording}>
                  ⏹ Stop Recording
                </button>
              )}
              {recording && <p className={styles.hint}>Recording… tap Stop when done</p>}
            </div>
          )}

          {preview && (
            <div className={styles.previewSection}>
              <button className={styles.previewBtn} onClick={handlePreview}>
                ▶ Preview
              </button>
              <p className={styles.readyText}>Audio ready</p>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button
            className={styles.assignBtn}
            onClick={handleAssign}
            disabled={!preview}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};
