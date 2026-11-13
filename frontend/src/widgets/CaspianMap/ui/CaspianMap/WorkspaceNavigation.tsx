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
    {entries.map(({ id, icon: Icon }) => <button type="button" key={id} aria-pressed={open && panel === id} onClick={() => onSelect(id)}><Icon size={20} strokeWidth={1.5} /><span>{panelLabels[id]}</span></button>)}
  </nav>;
}
