'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const done = () => setHydrated(true);
    const unsub = useAuthStore.persist.onFinishHydration(done);
    if (useAuthStore.persist.hasHydrated()) done();
    return unsub;
  }, []);

  return hydrated;
}
