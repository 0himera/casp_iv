'use client';

import { Button } from '@/shared/ui';
import styles from './SlashCommandBar.module.css';

interface SlashCommandBarProps {
  stormActive: boolean;
  xrayMode: boolean;
  canRunScenario: boolean;
  canSelectRoute: boolean;
  canAttest: boolean;
  isBusy: boolean;
  onToggleStorm: () => void;
  onRerouteAlternative: () => void;
  onVerifyEcmr: () => void;
  onToggleXray: () => void;
}

export function SlashCommandBar({
  stormActive,
  xrayMode,
  canRunScenario,
  canSelectRoute,
  canAttest,
  isBusy,
  onToggleStorm,
  onRerouteAlternative,
  onVerifyEcmr,
  onToggleXray,
}: SlashCommandBarProps) {
  return (
    <div className={styles.bar}>
      <Button type="button" size="sm" variant={stormActive ? 'destructive' : 'outline'} disabled={!canRunScenario || isBusy} onClick={onToggleStorm} className={styles.cmdBtn}>
        /simulate-storm
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={!canSelectRoute || isBusy} onClick={onRerouteAlternative} className={styles.cmdBtn}>
        /reroute-amirabad
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={!canAttest || isBusy} onClick={onVerifyEcmr} className={styles.cmdBtn}>
        /verify-ecmr
      </Button>
      <Button type="button" size="sm" variant={xrayMode ? 'secondary' : 'outline'} onClick={onToggleXray} className={styles.cmdBtn}>
        /xray-ports
      </Button>
    </div>
  );
}

