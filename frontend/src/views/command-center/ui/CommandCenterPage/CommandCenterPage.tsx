'use client';

import dynamic from 'next/dynamic';
import { Moon, Sun } from 'lucide-react';
import { useTheme, setTheme } from '@/shared/theme/ThemeProvider';
import { PassportPanel } from '@/features/passport-attestation';
import { DemoControls } from '@/features/demo-controls';
import { PlanningControls } from '@/features/route-selection/ui/PlanningControls';
import { ForecastMetaBlock } from '@/features/route-selection/ui/ForecastMetaBlock';
import { OperationBanner } from '@/features/route-selection/ui/OperationBanner';
import { TransportChain } from '@/features/route-selection/ui/TransportChain';
import { DraughtSimulator } from '@/widgets/DraughtSimulator';
import { EsgWidget } from '@/widgets/EsgWidget';
import { PredictiveChart } from '@/widgets/PredictiveChart';
import type { Role } from '@/shared/api/caspian';
import { useCommandCenterActions } from '../../model/useCommandCenterActions';
import { useCommandCenterState } from '../../model/useCommandCenterState';
import styles from './CommandCenterPage.module.css';

const MapWorkspace = dynamic(() => import('@/widgets/CaspianMap').then((m) => m.CaspianMap), {
  ssr: false, loading: () => <div className={styles.loading}>Загрузка карты Каспия…</div>,
});

export function CommandCenterPage() {
  const theme = useTheme();
  const s = useCommandCenterState();
  const stormActive = s.scenario === 'storm';
  const a = useCommandCenterActions({ ...s, stormActive });
  return <div className={styles.root}>
    <header className={styles.header}>
      <div className={styles.brand}>Caspian<span>Transit workspace</span></div>
      <label className={styles.shipment}><span>Отправка · сценарная</span>
        <select aria-label="Отправка" value={s.shipment.id} onChange={(e) => s.setSelectedId(e.target.value)}>
          {s.items.map((item) => <option key={item.id} value={item.id}>{item.title ?? item.id.slice(-5)}</option>)}
        </select>
      </label>
      <div className={styles.journey}><strong>{s.shipment.origin.name} → {s.shipment.destination.name}</strong><span>{s.shipment.mass_tonnes} т · открытые данные + условия расчёта</span></div>
      <span className={`${styles.connection} ${s.apiOnline ? styles.online : ''}`} role="status">{s.apiOnline ? 'API online' : 'API недоступен'}</span>
      <label className={styles.role}><span>Роль в preview</span><select aria-label="Роль" value={s.role} onChange={(e) => s.setRole(e.target.value as Role)}>
        <option value="logistician">Логист</option><option value="carrier">Перевозчик</option><option value="customs">Таможня</option>
      </select></label>
      <button className={styles.themeToggle} aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
    <div className={styles.operation} aria-live="polite"><OperationBanner activeOperation={s.activeOperation} operationTimedOut={s.operationTimedOut} errorBanner={s.errorBanner} onRecheckOperation={s.recheckNow} /></div>
    <main className={styles.workspace}>
      <MapWorkspace ports={s.ports} shipment={s.shipment} stormActive={stormActive} role={s.role} isBusy={s.isBusy} onSelectRoute={s.selectRoute} onChangeRole={s.setRole}
        forecast={<div className={styles.stack}>
          <ForecastMetaBlock forecast={s.shipment.forecast} />
          <PlanningControls key={s.shipment.forecast.id} shipment={s.shipment} isBusy={s.isBusy} onCalculate={s.recalculate} />
          <PredictiveChart shipment={s.shipment} stormActive={stormActive} />
          <TransportChain shipment={s.shipment} />
          <details className={styles.details}><summary>Проверить сценарий</summary><DemoControls showRoles={false} role={s.role} scenario={s.scenario} isBusy={s.isBusy} canRunScenario={a.canRunScenario} onChangeRole={s.setRole} onSelectScenario={s.selectScenario} /></details>
          <details className={styles.details}><summary>Осадка и уровень воды</summary><DraughtSimulator shipment={s.shipment} /></details>
          <details className={styles.details}><summary>Выбросы маршрута</summary><EsgWidget shipment={s.shipment} /></details>
        </div>}
        documents={<PassportPanel shipment={s.shipment} role={s.role} isBusy={s.isBusy} onAttest={s.attest} onRevoke={s.revoke} onVerifyEcmr={a.onVerifyEcmr} onReplaceDocument={s.replaceDocument} />}
      />
    </main>
  </div>;
}
