import type { CSSProperties } from 'react';
import { Anchor, ChartNoAxesCombined, FileCheck2, Route } from 'lucide-react';
import styles from './CaspianMap.module.css';

export type WorkspacePanel = 'routes' | 'forecast' | 'documents' | 'ports';
export const panelLabels: Record<WorkspacePanel, string> = { routes: 'Маршруты', forecast: 'Прогноз', documents: 'Документы', ports: 'Порты' };
const entries = [
  { id: 'routes', icon: Route }, { id: 'forecast', icon: ChartNoAxesCombined },
  { id: 'documents', icon: FileCheck2 }, { id: 'ports', icon: Anchor },
] as const;

export function WorkspaceNavigation({ panel, open, onSelect }: { panel: WorkspacePanel; open: boolean; onSelect: (panel: WorkspacePanel) => void }) {
  return <nav className={styles.navigation} aria-label="Разделы рабочего пространства">
    {entries.map(({ id, icon: Icon }, index) => <button type="button" key={id} style={{ '--index': index } as CSSProperties}
      aria-label={panelLabels[id]} title={panelLabels[id]} aria-pressed={panel === id} aria-expanded={open && panel === id}
      aria-controls="workspace-panel-content" onClick={() => onSelect(id)}>
      <Icon size={21} strokeWidth={1.7} /><span>{panelLabels[id]}</span>
    </button>)}
  </nav>;
}
