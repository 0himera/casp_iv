export interface FloatingCommandBarProps {
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
