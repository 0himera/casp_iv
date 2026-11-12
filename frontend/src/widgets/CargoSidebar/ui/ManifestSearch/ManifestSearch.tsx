'use client';

import { Search } from 'lucide-react';
import styles from './ManifestSearch.module.css';

interface ManifestSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ManifestSearch({ value, onChange }: ManifestSearchProps) {
  return (
    <div className={styles.searchWrap}>
      <Search className={styles.searchIcon} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск груза или порта..."
        className={styles.searchInput}
      />
    </div>
  );
}
