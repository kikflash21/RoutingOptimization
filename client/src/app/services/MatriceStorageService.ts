import { Injectable } from '@angular/core';

interface MatrixCacheEntry {
  ids: number[];
  matrix: number[][];
  timestamp: number;
}

interface MatriceResponseDTO {
  id: { idCommandeDepart: number; idCommandeArrivee: number };
  duree: number;
}

/**
 * Two-level distance-matrix cache:
 *   - localStorage    → instant per-browser hits, also keeps UI checks synchronous.
 *   - backend `/api/matrice` → shared across browsers/devices so switching browser
 *     doesn't lose an identical matrix. Read on miss, write-through on save.
 *
 * Backend stores per-pair rows (idCommandeDepart, idCommandeArrivee, duree). The 2D
 * matrix is rebuilt from those rows on the client, with the diagonal set to 0.
 */
@Injectable({ providedIn: 'root' })
export class MatriceStorageService {
  private readonly PREFIX = 'dms_matrix_';
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24h
  private readonly API_URL = '/api/matrice';

  private _key(ids: number[]): string {
    return this.PREFIX + this._sortedIds(ids).join('_');
  }

  private _sortedIds(ids: number[]): number[] {
    return [...ids].sort((a, b) => a - b);
  }

  /** Synchronous local read — used by the UI to render the "cache available" chip. */
  load(ids: number[]): MatrixCacheEntry | null {
    try {
      const raw = localStorage.getItem(this._key(ids));
      if (!raw) return null;
      const entry: MatrixCacheEntry = JSON.parse(raw);
      if (!this._validShape(entry, ids.length)) {
        this.remove(ids);
        return null;
      }
      if (Date.now() - entry.timestamp > this.TTL_MS) {
        this.remove(ids);
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  }

  /**
   * Async lookup that falls back to the backend on a local miss. When the backend
   * returns a complete matrix for the requested IDs, the entry is mirrored into
   * localStorage for subsequent fast reads.
   */
  async loadShared(ids: number[]): Promise<MatrixCacheEntry | null> {
    const local = this.load(ids);
    if (local) return local;

    try {
      const params = new URLSearchParams();
      ids.forEach(id => params.append('ids', String(id)));
      const res = await fetch(`${this.API_URL}/get?${params.toString()}`);
      if (!res.ok) return null;
      const rows: MatriceResponseDTO[] = await res.json();
      const matrix = this._rebuildMatrix(ids, rows);
      if (!matrix) return null;
      const entry: MatrixCacheEntry = { ids: [...ids], matrix, timestamp: Date.now() };
      this._writeLocal(ids, entry);
      return entry;
    } catch {
      return null;
    }
  }

  /** Write-through save: local first (instant), then backend (fire-and-forget). */
  save(ids: number[], matrix: number[][]): void {
    const entry: MatrixCacheEntry = { ids, matrix, timestamp: Date.now() };
    this._writeLocal(ids, entry);
    this._pushToBackend(ids, matrix);
  }

  remove(ids: number[]): void {
    localStorage.removeItem(this._key(ids));
  }

  clearAll(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.PREFIX)) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  }

  ageLabel(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH}h`;
    return `il y a ${Math.floor(diffH / 24)}j`;
  }

  private _writeLocal(ids: number[], entry: MatrixCacheEntry): void {
    try {
      localStorage.setItem(this._key(ids), JSON.stringify(entry));
    } catch {
      console.warn('LocalStorage plein, impossible de sauvegarder la matrice.');
    }
  }

  private _pushToBackend(ids: number[], matrix: number[][]): void {
    fetch(this.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idsCommandes: ids, durations: matrix }),
    }).catch(() => { /* best-effort sharing */ });
  }

  /**
   * Rebuild an NxN duration matrix from the per-pair rows returned by the backend.
   * Returns null if the rows don't cover the full matrix (off-diagonal only — the
   * diagonal is always 0 and never stored by the backend).
   */
  private _rebuildMatrix(ids: number[], rows: MatriceResponseDTO[]): number[][] | null {
    const n = ids.length;
    const idxById = new Map<number, number>();
    ids.forEach((id, i) => idxById.set(id, i));

    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const filled: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
    for (let i = 0; i < n; i++) filled[i][i] = true; // diagonal implicit

    for (const r of rows) {
      const i = idxById.get(r.id.idCommandeDepart);
      const j = idxById.get(r.id.idCommandeArrivee);
      if (i == null || j == null) continue;
      matrix[i][j] = r.duree;
      filled[i][j] = true;
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!filled[i][j]) return null;
      }
    }
    return matrix;
  }

  private _validShape(entry: MatrixCacheEntry, expectedSize: number): boolean {
    return entry.ids?.length === expectedSize
      && entry.matrix?.length === expectedSize
      && entry.matrix.every(row => row.length === expectedSize);
  }
}
