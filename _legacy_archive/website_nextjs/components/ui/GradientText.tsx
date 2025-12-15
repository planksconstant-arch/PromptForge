'use client';

import { ReactNode } from 'react';

interface TrueFocusProps {
    sentence?: string;
    manualMode?: boolean;
    blurAmount?: number;
    borderColor?: string;
    glowColor?: string;
    animationDuration?: number;
    pauseBetweenAnimations?: number;
}

export default function GradientText({
    children,
    className = "",
    colors = ["#ffaa40", "#9c40ff", "#ffaa40"],
    animationSpeed = 8,
    showBorder = false,
}: {
    children: ReactNode;
    className?: string;
    colors?: string[];
    animationSpeed?: number;
    showBorder?: boolean;
}) {
    const gradientStyle = {
        backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
        animationDuration: `${animationSpeed}s`,
    };

    return (
        <div className={`animated-gradient-text-container ${className}`}>
            <span
                className="animate-gradient bg-clip-text text-transparent bg-[length:300%_100%]"
                style={gradientStyle}
            >
                {children}
            </span>
        </div>
    );
}
