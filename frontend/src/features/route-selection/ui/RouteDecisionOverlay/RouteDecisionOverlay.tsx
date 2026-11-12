'use client';

import type { Operation, Shipment } from '@/shared/api/caspian';
import { ViewfinderFrame } from '@/shared/ui';
import { TransportChain } from '../TransportChain';
import { ForecastMetaBlock } from '../ForecastMetaBlock';
import { OperationBanner } from '../OperationBanner';
import { RecommendationBanner } from '../RecommendationBanner';
import { RouteOptionRow } from '../RouteOptionRow';
import styles from './RouteDecisionOverlay.module.css';

export interface RouteDecisionOverlayProps {
  shipment: Shipment;
  stormActive?: boolean;
  activeOperation: Operation | null;
  operationTimedOut: boolean;
  errorBanner: string | null;
  isBusy: boolean;
  onSelectRoute: (routeId: string) => void;
  onRerouteAlternative?: () => void;
  onRecheckOperation: () => void;
}

export function RouteDecisionOverlay({
  shipment,
  activeOperation,
  operationTimedOut,
  errorBanner,
  isBusy,
  onSelectRoute,
  onRerouteAlternative,
  onRecheckOperation,
}: RouteDecisionOverlayProps) {
  const { forecast, routes, selected_route_id, allowed_actions } = shipment;
  const canSelect = allowed_actions.includes('select_route') && !isBusy;

  return (
    <ViewfinderFrame stamp="[ 01-ROUTE / MTC-PREDICTIVE ]" className={styles.overlayCard}>
      <div className={styles.content}>
        <ForecastMetaBlock forecast={forecast} />
        <TransportChain shipment={shipment} />
        <RecommendationBanner shipment={shipment} canSelectRoute={canSelect} isBusy={isBusy} onRerouteAlternative={onRerouteAlternative} />
        <OperationBanner activeOperation={activeOperation} operationTimedOut={operationTimedOut} errorBanner={errorBanner} onRecheckOperation={onRecheckOperation} />
        <div className={styles.routesList}>
          {routes.map((route) => (
            <RouteOptionRow key={route.id} route={route} isSelected={route.id === selected_route_id} canSelect={canSelect} onSelect={onSelectRoute} />
          ))}
        </div>
      </div>
    </ViewfinderFrame>
  );
}
