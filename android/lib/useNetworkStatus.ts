import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useStore } from '@/lib/store';

export function useNetworkStatus() {
  const setOnline = useStore((s) => s.setOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, [setOnline]);
}
