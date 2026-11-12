'use client';

import { Terminal } from 'lucide-react';
import type { FloatingCommandBarProps } from '../../model/types';
import { CommandButton } from '../CommandButton';
import styles from './FloatingCommandBar.module.css';

export function FloatingCommandBar({
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
}: FloatingCommandBarProps) {
  return (
    <div className={styles.bar}>
      <span className={styles.lead}>
        <Terminal size={13} className={styles.leadIcon} />
        <span className={styles.leadText}>CMD</span>
      </span>
      <CommandButton
        label="/simulate-storm"
        variant={stormActive ? 'destructive' : 'outline'}
        disabled={!canRunScenario || isBusy}
        onClick={onToggleStorm}
      />
      <CommandButton
        label="/reroute-amirabad"
        disabled={!canSelectRoute || isBusy}
        onClick={onRerouteAlternative}
      />
      <CommandButton
        label="/verify-ecmr"
        disabled={!canAttest || isBusy}
        onClick={onVerifyEcmr}
      />
      <CommandButton
        label="/xray-ports"
        variant={xrayMode ? 'secondary' : 'outline'}
        onClick={onToggleXray}
      />
    </div>
  );
}
