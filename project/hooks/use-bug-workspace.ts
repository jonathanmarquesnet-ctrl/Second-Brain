'use client';

import { useMemo, useState } from 'react';
import { applyFile, isTooLarge, listFiles, pickDirectory, readFile, recordAttempt, restoreLatestBackup, type BugDirectoryHandle, type BugFile } from '@/lib/bugs/file-system';

const BACKUP_NOTICE = 'Correção aplicada. Backup salvo em .projeto_x_core/backups/.';
const UNDO_NOTICE = 'Alteração desfeita. O arquivo voltou à versão do backup.';
const UNDO_MODEL = 'desfazer';
const LOG_FAILURE = 'Não foi possível registrar no banco de memória.';
const SMALLER_RATIO = 0.3;

export function useBugWorkspace() {
  const [root, setRoot] = useState<BugDirectoryHandle | null>(null);
  const [files, setFiles] = useState<BugFile[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<BugFile | null>(null);
  const [tooLarge, setTooLarge] = useState(false);
  const [original, setOriginal] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const visibleFiles = useMemo(() => files.filter((file) => file.name.toLowerCase().includes(filter.trim().toLowerCase())), [files, filter]);

  function clearSelection(): void {
    setSelected(null);
    setTooLarge(false);
    setNotice('');
    setError('');
  }

  async function openFolder(): Promise<void> {
    try {
      const handle = await pickDirectory();
      setRoot(handle);
      setFiles(await listFiles(handle));
      setFilter('');
      clearSelection();
    } catch (reason) {
      const cancelled = reason instanceof DOMException && reason.name === 'AbortError';
      if (!cancelled) setError(reason instanceof Error && reason.message === 'unsupported' ? 'Disponível apenas no Chrome/Edge, em aba própria' : 'Não foi possível abrir a pasta.');
    }
  }

  async function chooseFile(file: BugFile): Promise<void> {
    clearSelection();
    setSelected(file);
    try {
      if (await isTooLarge(file.handle)) return setTooLarge(true);
      setOriginal(await readFile(file.handle));
    } catch {
      setError('Não foi possível ler o arquivo.');
    }
  }

  async function applyContent(content: string, model: string): Promise<boolean> {
    if (!root || !selected) return false;
    const target = selected;
    setError('');
    setNotice('');
    if (!content.trim()) {
      setError('O conteúdo novo está vazio. Nada foi aplicado.');
      return false;
    }
    const isMuchSmaller = content.length < original.length * SMALLER_RATIO;
    const question = isMuchSmaller ? 'O novo arquivo é muito menor. Tem certeza?' : 'Aplicar a alteração e substituir o arquivo? Um backup será salvo antes.';
    if (!window.confirm(question)) {
      await recordAttempt(root, target.path, model, false).catch(() => setError(LOG_FAILURE));
      return false;
    }
    setBusy(true);
    try {
      await applyFile(root, target, content, model);
      setOriginal(await readFile(target.handle));
      setNotice(BACKUP_NOTICE);
      return true;
    } catch {
      setError('Não foi possível aplicar a alteração.');
      await recordAttempt(root, target.path, model, false).catch(() => setError(LOG_FAILURE));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function undoLast(): Promise<void> {
    if (!root || !selected) return;
    if (!window.confirm('Desfazer a última alteração e restaurar o backup mais recente deste arquivo?')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (!(await restoreLatestBackup(root, selected))) {
        setError('Nenhum backup encontrado para este arquivo.');
        return;
      }
      setOriginal(await readFile(selected.handle));
      await recordAttempt(root, selected.path, UNDO_MODEL, true).catch(() => setError(LOG_FAILURE));
      setNotice(UNDO_NOTICE);
    } catch {
      setError('Não foi possível desfazer a alteração.');
    } finally {
      setBusy(false);
    }
  }

  return {
    root, visibleFiles, filter, setFilter, selected, tooLarge, original, busy, notice, error,
    setBusy, setError, openFolder, chooseFile, applyContent, undoLast,
  };
}
