"use client";
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setTokenGetter } from '@/lib/api';

/** Wires the Clerk token into the API client once, client-side. */
export function TokenInjector() {
    const { getToken } = useAuth();
    useEffect(() => {
        setTokenGetter(() => getToken());
    }, [getToken]);
    return null;
}
