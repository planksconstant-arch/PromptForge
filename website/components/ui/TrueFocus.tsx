'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TrueFocusProps {
    sentence?: string;
    manualMode?: boolean;
    blurAmount?: number;
    borderColor?: string;
    glowColor?: string;
    animationDuration?: number;
    pauseBetweenAnimations?: number;
}

export default function TrueFocus({
    sentence = 'True Focus',
    manualMode = false,
    blurAmount = 5,
    borderColor = '#00F0FF',
    glowColor = 'rgba(0, 240, 255, 0.6)',
    animationDuration = 0.5,
    pauseBetweenAnimations = 1,
}: TrueFocusProps) {
    const words = sentence.split(' ');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (manualMode) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % words.length);
        }, (animationDuration + pauseBetweenAnimations) * 1000);

        return () => clearInterval(interval);
    }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

    return (
        <div className="relative flex gap-4 justify-center items-center flex-wrap">
            {words.map((word, index) => {
                const isActive = index === currentIndex;
                return (
                    <span
                        key={index}
                        className="relative text-[3rem] font-black cursor-pointer"
                        style={{
                            filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
                            opacity: isActive ? 1 : 0.5,
                            transition: `all ${animationDuration}s ease`,
                        }}
                        onMouseEnter={() => manualMode && setCurrentIndex(index)}
                    >
                        {word}
                        {isActive && (
                            <motion.div
                                layoutId="focus-box"
                                className="absolute -inset-2 border-[2px] rounded-lg"
                                style={{
                                    borderColor: borderColor,
                                    boxShadow: `0 0 20px ${glowColor}`,
                                }}
                                transition={{
                                    duration: animationDuration,
                                }}
                            />
                        )}
                    </span>
                );
            })}
        </div>
    );
}
