'use client';

import { FloatingCommandBar } from '@/widgets/FloatingCommandBar';

interface CommandCenterActionsProps {
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

export function CommandCenterActions(props: CommandCenterActionsProps) {
  return <FloatingCommandBar {...props} />;
}
