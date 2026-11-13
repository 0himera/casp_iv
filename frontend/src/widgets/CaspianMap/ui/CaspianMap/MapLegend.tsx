import { FlaskConical, Info, Wind } from 'lucide-react';
import { WorkspacePopover } from '@/shared/ui/workspace-menu/WorkspaceMenu';
import styles from './MapLegend.module.css';

export function MapLegend({ mode, previewLabel, hasLand, hasAlternatives }: { mode: 'map' | 'graph'; previewLabel?: string; hasLand: boolean; hasAlternatives: boolean }) {
  return <div className={styles.legend} aria-label="Легенда карты">
    {mode === 'map' ? <>
      {previewLabel && <span className={styles.preview}>Предпросмотр: {previewLabel}</span>}
      <span className={styles.key}><i className={styles.sea} />Море</span>
      {hasLand && <span className={styles.key}><i className={styles.land} />Ж/д / авто</span>}
      {hasAlternatives && <span className={styles.key}><i className={styles.alternative} />Альтернативы</span>}
      <span className={styles.key}><Wind size={13} />Ветер, км/ч</span>
    </> : <span>Транспортная цепочка</span>}
    <span className={styles.scenario} title="Груз и условия расчёта — сценарные"><FlaskConical size={12} />Сценарий</span>
    <WorkspacePopover label="Источники карты" className={styles.info} minWidth={260} trigger={<Info size={16} />}>
      <strong>Карта и обозначения</strong>
      <p>Сплошные линии — выбранный маршрут. Оранжевая — ж/д или авто, жёлтая — морской участок. Пунктир — альтернативы.</p>
      <p>Числа рядом с портами — прогноз ветра в км/ч. Значок часов отмечает устаревший снимок.</p>
      <p>Груз и условия расчёта сценарные. Геометрия моря не заменяет навигационные карты.</p>
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
      <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">© CARTO</a>
      <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth · маска воды</a>
    </WorkspacePopover>
  </div>;
}
