'use client';

import { RouteDecisionOverlay } from '@/features/route-selection';
import { AsciiCaspianBackground } from '@/shared/ui';
import { CargoSidebar } from '@/widgets/CargoSidebar';
import { NavigationRail } from '@/widgets/NavigationRail';
import { SpatialCore } from '@/widgets/SpatialCore';
import { useCommandCenterActions } from '../../model/useCommandCenterActions';
import { useCommandCenterState } from '../../model/useCommandCenterState';
import { useLayoutState } from '../../model/useLayoutState';
import { AnalyticsPanel } from '../AnalyticsPanel';
import { CommandCenterActions } from '../CommandCenterActions';
import { CommandCenterTopBar } from '../CommandCenterTopBar';
import { CustomsOverlay } from '../CustomsOverlay';
import styles from './CommandCenterPage.module.css';

export function CommandCenterPage() {
  const s = useCommandCenterState();
  const l = useLayoutState();
  const stormActive = s.scenario === 'storm';
  const a = useCommandCenterActions({ ...s, stormActive });

  return (
    <div className={styles.root}>
      <AsciiCaspianBackground />
      <SpatialCore mode={l.mode} ports={s.ports} shipment={s.shipment} stormActive={stormActive} xrayMode={l.xrayMode} />
      <NavigationRail mode={l.mode} onToggleMode={l.setMode} manifestOpen={l.manifestOpen} onToggleManifest={l.toggleManifest} customsOpen={l.customsOpen} onToggleCustoms={l.toggleCustoms} analyticsOpen={l.analyticsOpen} onToggleAnalytics={l.toggleAnalytics} />
      <CargoSidebar isOpen={l.manifestOpen} onClose={l.closeManifest} items={s.items} shipment={s.shipment} onSelectShipment={s.setSelectedId} />
      <CommandCenterTopBar shipment={s.shipment} apiOnline={s.apiOnline} role={s.role} scenario={s.scenario} isBusy={s.isBusy} onChangeRole={s.setRole} onSelectScenario={s.selectScenario} />
      <RouteDecisionOverlay shipment={s.shipment} activeOperation={s.activeOperation} operationTimedOut={s.operationTimedOut} errorBanner={s.errorBanner} isBusy={s.isBusy} onSelectRoute={s.selectRoute} onRecheckOperation={s.recheckNow} />
      <CustomsOverlay shipment={s.shipment} role={s.role} isBusy={s.isBusy} isOpen={l.customsOpen} onAttest={s.attest} onReplaceDocument={s.replaceDocument} />
      <AnalyticsPanel shipment={s.shipment} stormActive={stormActive} isOpen={l.analyticsOpen} />
      <CommandCenterActions stormActive={stormActive} xrayMode={l.xrayMode} isBusy={s.isBusy} onToggleXray={l.toggleXray} {...a} />
    </div>
  );
}
