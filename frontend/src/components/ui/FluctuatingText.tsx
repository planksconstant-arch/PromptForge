import React, { useEffect, useState } from 'react';

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";

interface FluctuatingTextProps {
    text: string;
    className?: string;
    animateOnHover?: boolean;
}

export const FluctuatingText: React.FC<FluctuatingTextProps> = ({ text, className, animateOnHover = false }) => {
    const [display, setDisplay] = useState(text);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        // If animateOnHover is true, only animate when hovered.
        // If false, animate once on mount/text change.
        if (animateOnHover && !isHovered) {
            setDisplay(text);
            return;
        }

        let iterations = 0;
        const interval = setInterval(() => {
            setDisplay(text.split("").map((letter, index) => {
                if (index < iterations) {
                    return text[index];
                }
                return letters[Math.floor(Math.random() * letters.length)];
            }).join(""));

            if (iterations >= text.length) {
                clearInterval(interval);
            }

            iterations += 1 / 3;
        }, 30);

        return () => clearInterval(interval);
    }, [text, isHovered, animateOnHover]);

    const handleMouseEnter = () => {
        if (animateOnHover) setIsHovered(true);
    };

    const handleMouseLeave = () => {
        if (animateOnHover) setIsHovered(false);
    };

    return (
        <span
            className={className}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {display}
        </span>
    );
};
