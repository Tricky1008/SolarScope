import React, { useRef, useState } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion";

export function Dock({ children }: { children: React.ReactNode }) {
    const mouseX = useMotionValue(Infinity);

    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="mx-auto flex h-16 items-end gap-2 rounded-2xl bg-midnight/70 backdrop-blur-md border border-divider px-3 pb-2 shadow-deep"
        >
            {/* We pass down mouseX to each child so they can compute their distance */}
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, { mouseX });
                }
                return child;
            })}
        </motion.div>
    );
}

export function DockItem({
    mouseX,
    icon: Icon,
    label,
    onClick,
    isActive = false,
}: {
    mouseX?: any;
    icon: any;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
}) {
    const ref = useRef<HTMLButtonElement>(null);

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    // Scale based on distance from mouse
    const widthSync = useTransform(distance, [-150, 0, 150], [44, 75, 44]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    const [hovered, setHovered] = useState(false);

    return (
        <div className="relative group/dock flex items-end justify-center">
            <motion.button
                ref={ref}
                style={{ width, height: width }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={onClick}
                whileTap={{ scale: 0.9 }}
                className={`relative flex items-center justify-center rounded-2xl border ${isActive
                    ? "bg-slate-blue/30 border-electric-blue/50 text-electric-blue shadow-glow"
                    : "bg-surface-light border-divider text-text-secondary hover:text-text-primary"
                    } transition-colors cursor-pointer`}
            >
                <div className="flex items-center justify-center h-full w-full">
                    <Icon className="w-[50%] h-[50%]" />
                </div>
            </motion.button>

            {/* Tooltip */}
            {hovered && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-surface-light border border-divider text-text-primary text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-lg"
                >
                    {label}
                </motion.div>
            )}
        </div>
    );
}
