'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PassportPanel } from '@/features/passport-attestation';
import type { Role, Shipment, ShipmentSummary } from '@/shared/api/caspian';
import { PixelMarker, ScrollArea } from '@/shared/ui';
import { CargoItemCard } from '../CargoItemCard';
import styles from './CargoSidebar.module.css';

interface CargoSidebarProps {
  items: ShipmentSummary[];
  shipment: Shipment;
  role: Role;
  isBusy: boolean;
  onSelectShipment: (id: string) => void;
  onAttest: (decision: 'approved' | 'rejected') => void;
  onReplaceDocument: (docId: string, filename: string, contentBase64: string) => void;
}

export function CargoSidebar({ items, shipment, role, isBusy, onSelectShipment, onAttest, onReplaceDocument }: CargoSidebarProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => `${i.id} ${i.title} ${i.origin} ${i.destination}`.toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionHeader}>
        <span className={styles.titleWrap}>
          <PixelMarker variant="telemetry" />
          <h2 className={styles.heading}>Отправления (rev.{shipment.revision})</h2>
        </span>
        <span className={styles.counter}>* {filtered.length}</span>
      </div>
      <div className={styles.searchWrap}>
        <Search className={styles.searchIcon} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск груза или порта..." className={styles.searchInput} />
      </div>
      <ScrollArea className={styles.listScroll}>
        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>Отправления не найдены</div>
          ) : (
            filtered.map((item) => <CargoItemCard key={item.id} item={item} isSelected={item.id === shipment.id} onSelect={onSelectShipment} />)
          )}
        </div>
      </ScrollArea>
      <PassportPanel shipment={shipment} role={role} isBusy={isBusy} onAttest={onAttest} onReplaceDocument={onReplaceDocument} />
    </aside>
  );
}
