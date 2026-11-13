'use client';

import dynamic from 'next/dynamic';
import { WorkspaceMenus, WorkspaceSelect } from '@/shared/ui/workspace-menu/WorkspaceMenu';
import { ArrowUpRight, Moon, SquareCode, Sun } from 'lucide-react';
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
  const contractHash = s.shipment.passport.contract_address?.replace(/^hash-/, '');
  const contractUrl = s.shipment.passport.network === 'casper-test' && contractHash && /^[a-f0-9]{64}$/i.test(contractHash)
    ? `https://testnet.cspr.live/contract/${contractHash}` : null;
  const stormActive = s.scenario === 'storm';
  const a = useCommandCenterActions({ ...s, stormActive });
  return <WorkspaceMenus><div className={styles.root}>
    <header className={styles.header}>
      <div className={styles.brand}>Caspian<span>Transit workspace</span></div>
      <div className={styles.shipment}><span>Отправка · сценарная</span>
        <WorkspaceSelect label="Отправка" value={s.shipment.id} onChange={s.setSelectedId} minWidth={360} options={s.items.map((item) => ({ value: item.id, label: item.title ?? item.id.slice(-5) }))} />
      </div>
      <div className={styles.journey}><strong>{s.shipment.origin.name} → {s.shipment.destination.name}</strong><span>{s.shipment.mass_tonnes} т · открытые данные + условия расчёта</span></div>
      <span className={`${styles.connection} ${s.apiOnline ? styles.online : ''}`} role="status">{s.apiOnline ? 'API online' : 'API недоступен'}</span>
      {contractUrl && <a className={styles.contractLink} href={contractUrl} target="_blank" rel="noopener noreferrer" aria-label="Смарт-контракт в Casper Live (testnet)" title="Смарт-контракт · Casper Testnet · открыть в новой вкладке"><SquareCode size={16} /><span>Контракт <ArrowUpRight size={12} /></span></a>}
      <div className={styles.role}><span>Роль в preview</span><WorkspaceSelect label="Роль" value={s.role} onChange={(value) => s.setRole(value as Role)} options={[
        { value: 'logistician', label: 'Логист' }, { value: 'carrier', label: 'Перевозчик' }, { value: 'customs', label: 'Таможня' },
      ]} /></div>
      <button className={styles.themeToggle} aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
    <div className={styles.operation} aria-live="polite"><OperationBanner activeOperation={s.activeOperation} operationTimedOut={s.operationTimedOut} errorBanner={s.errorBanner} onRecheckOperation={s.recheckNow} /></div>
    <main className={styles.workspace}>
      <MapWorkspace ports={s.ports} shipment={s.shipment} stormActive={stormActive} role={s.role} isBusy={s.isBusy} onSelectRoute={s.selectRoute} onChangeRole={s.setRole} onChangeJourney={s.changeJourney}
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
  </div></WorkspaceMenus>;
}
