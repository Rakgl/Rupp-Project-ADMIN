export const useCustomPWA = () => {
  const isPWA = ref(false);
  const isUpdateAvailable = ref(false);

  const checkPWAMode = () => {
    if (typeof window === 'undefined') return false;

    // Check if running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Check if navigator.standalone is true (iOS Safari)
    const isIOSStandalone = (window.navigator as any).standalone === true;

    // Check if the page was launched from the home screen
    const isFromHomeScreen = window.location.search.includes('homescreen=1');

    return isStandalone || isIOSStandalone || isFromHomeScreen;
  };

  const reloadApp = async () => {
    if (typeof window !== 'undefined') {
      // If there's a service worker, try to update it first
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.waiting) {
            // Tell the waiting service worker to become active
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          // Force reload to get the latest version
          window.location.reload();
        } catch (error) {
          console.warn('Service worker update failed:', error);
          // Fallback to normal reload
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    }
  };

  const checkForUpdates = async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        isUpdateAvailable.value = !!registration.waiting;
      } catch (error) {
        console.warn('Update check failed:', error);
      }
    }
  };

  onMounted(() => {
    isPWA.value = checkPWAMode();

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      isPWA.value = e.matches;
    };

    mediaQuery.addEventListener('change', handleChange);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // A new service worker has taken control, reload to get the new version
        window.location.reload();
      });
    }

    // Check for updates on mount
    checkForUpdates();

    // Cleanup
    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handleChange);
    });
  });

  return {
    isPWA: readonly(isPWA),
    isUpdateAvailable: readonly(isUpdateAvailable),
    checkPWAMode,
    reloadApp,
    checkForUpdates,
  };
};
