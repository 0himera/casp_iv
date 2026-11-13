'use client';

import { useState } from 'react';
import { DEFAULT_SWAP_CANDIDATE } from './mockCandidate';
import type { SlotSwapState, SwapStep } from './types';

export function useSlotSwap(shipmentId: string) {
  const [state, setState] = useState<SlotSwapState>({
    isOpen: false,
    step: 'review',
    candidate: DEFAULT_SWAP_CANDIDATE,
    isExecuted: false,
    activeShipmentId: shipmentId,
  });

  const openModal = () => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      step: prev.isExecuted ? 'confirmed' : 'review',
    }));
  };

  const closeModal = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const executeSwap = () => {
    setState((prev) => ({ ...prev, step: 'executing' }));
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        step: 'confirmed',
        isExecuted: true,
      }));
    }, 1200);
  };

  const resetSwap = () => {
    setState({
      isOpen: false,
      step: 'review',
      candidate: DEFAULT_SWAP_CANDIDATE,
      isExecuted: false,
      activeShipmentId: shipmentId,
    });
  };

  return {
    isOpen: state.isOpen,
    step: state.step,
    candidate: state.candidate,
    isExecuted: state.isExecuted,
    openModal,
    closeModal,
    executeSwap,
    resetSwap,
  };
}

