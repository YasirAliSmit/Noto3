import { useCallback } from 'react';

type Options = {
  isFunctionsEnabled: boolean;
  clickCount: number;
  incrementClick: () => void;
  setShowAd: (value: boolean) => void;
  setShowLoadingAlert: (value: boolean) => void;
  delayMs?: number;
};

const DEFAULT_DELAY = 5000;

export const useGatedAction = ({
  isFunctionsEnabled,
  clickCount,
  incrementClick,
  setShowAd,
  setShowLoadingAlert,
  delayMs = DEFAULT_DELAY,
}: Options) =>
  useCallback(
    (action: () => void) => {
      const nextClick = clickCount + 1;
      const shouldShowAd = isFunctionsEnabled && nextClick % 3 === 0;

      incrementClick();

      if (!shouldShowAd) {
        action();
        return;
      }

      setShowAd(true);
      setShowLoadingAlert(true);

      setTimeout(() => {
        action();
      }, delayMs);
    },
    [clickCount, delayMs, incrementClick, isFunctionsEnabled, setShowAd, setShowLoadingAlert],
  );

export default useGatedAction;
