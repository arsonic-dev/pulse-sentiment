"use client";

import { useEffect, RefObject } from 'react';

interface AntigravityOptions {
    maxRotateX?: number;
    maxRotateY?: number;
    restX?: number;
    restY?: number;
}

export const useAntigravity = (ref: RefObject<HTMLElement>, options: AntigravityOptions = {}) => {
    const { maxRotateX = 14, maxRotateY = 20, restX = 8, restY = -14 } = options;

    useEffect(() => {
        const el = ref.current;
        const parent = el?.parentElement;
        if (!el || !parent) return;

        const handleMove = (e: MouseEvent) => {
            const rect = parent.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            el.style.transform = `
        perspective(1200px)
        rotateX(${(y - 0.5) * -maxRotateX}deg)
        rotateY(${(x - 0.5) * maxRotateY}deg)
        translateZ(24px)
      `;
        };

        const handleLeave = () => {
            el.style.transition = 'transform 0.7s ease-out';
            el.style.transform = `perspective(1200px) rotateX(${restX}deg) rotateY(${restY}deg) translateZ(0)`;
            setTimeout(() => {
                if (el) el.style.transition = 'transform 0.1s ease-out';
            }, 700);
        };

        parent.addEventListener('mousemove', handleMove);
        parent.addEventListener('mouseleave', handleLeave);

        return () => {
            parent.removeEventListener('mousemove', handleMove);
            parent.removeEventListener('mouseleave', handleLeave);
        };
    }, [ref, maxRotateX, maxRotateY, restX, restY]);
};
