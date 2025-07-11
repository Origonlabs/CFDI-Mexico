
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useToast } from './use-toast';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useSessionTimeout() {
  const router = useRouter();
  const { toast } = useToast();
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const handleSignOut = useCallback(() => {
    if (auth) {
      firebaseSignOut(auth)
        .then(() => {
          toast({
            title: 'Sesión cerrada por inactividad',
            description: 'Serás redirigido a la página de inicio.',
          });
          router.push('/');
        })
        .catch((error) => {
          console.error('Error signing out: ', error);
        });
    }
  }, [router, toast]);

  const resetTimeout = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
  }, [handleSignOut]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];

    const eventHandler = () => {
      resetTimeout();
    };

    // Set initial timeout
    resetTimeout();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, eventHandler);
    });

    // Cleanup function
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, eventHandler);
      });
    };
  }, [resetTimeout]);
}
