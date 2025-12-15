"use client";

import React, { useEffect, useRef } from 'react';
import './pixel-card.css';
import { cn } from '@/lib/utils';

interface PixelCardProps {
    variant?: 'blue' | 'pink' | 'green' | 'default';
    children?: React.ReactNode;
    className?: string;
}

export default function PixelCard({
    variant = 'default',
    children,
    className
}: PixelCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        const glow = glowRef.current;
        const wrapper = wrapperRef.current;
        if (!card || !glow || !wrapper) return;

        const handleMouseMove = (event: MouseEvent) => {
            const rect = wrapper.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            glow.style.setProperty('--x', `${x}px`);
            glow.style.setProperty('--y', `${y}px`);
            glow.style.opacity = '0.4';
        };

        const handleMouseLeave = () => {
            glow.style.opacity = '0';
        };

        wrapper.addEventListener('mousemove', handleMouseMove);
        wrapper.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            wrapper.removeEventListener('mousemove', handleMouseMove);
            wrapper.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div
            className={cn("pixel-card-wrapper h-full w-full", className)}
            ref={wrapperRef}
        >
            <div
                className={cn("pixel-card-container", variant)}
                ref={cardRef}
            >
                <div className="relative z-20 w-full h-full">
                    {children}
                </div>
                <div className="pixel-card-glow" ref={glowRef}></div>
            </div>
        </div>
    );
}
