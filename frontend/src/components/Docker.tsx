import React, { useRef, useState, useCallback } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    AnimatePresence,
} from "framer-motion";

const DOCK_ITEM_BASE = 48;
const DOCK_ITEM_MAGNIFIED = 72;
const MAGNIFICATION_RANGE = 150;

export function Dock({ children }: { children: React.ReactNode }) {
    const mouseX = useMotionValue(Infinity);

    const handleInteraction = useCallback((clientX: number) => {
        mouseX.set(clientX);
    }, [mouseX]);

    const handleInteractionEnd = useCallback(() => {
        mouseX.set(Infinity);
    }, [mouseX]);

    return (
        <motion.div
            onMouseMove={(e) => handleInteraction(e.pageX)}
            onMouseLeave={handleInteractionEnd}
            onTouchMove={(e) => {
                if (e.touches[0]) handleInteraction(e.touches[0].clientX);
            }}
            onTouchEnd={handleInteractionEnd}
            className="mx-auto flex items-end gap-[6px] rounded-2xl bg-black/60 backdrop-blur-xl border border-white/[0.08] px-3 pb-2 pt-2 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]"
            style={{
                WebkitBackdropFilter: 'blur(20px)',
            }}
        >
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
    const [hovered, setHovered] = useState(false);

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    // iOS-style magnification: items grow as the pointer approaches
    const sizeSync = useTransform(
        distance,
        [-MAGNIFICATION_RANGE, 0, MAGNIFICATION_RANGE],
        [DOCK_ITEM_BASE, DOCK_ITEM_MAGNIFIED, DOCK_ITEM_BASE]
    );

    const size = useSpring(sizeSync, {
        mass: 0.1,
        stiffness: 170,
        damping: 12,
    });

    // Vertical bounce for the icon when magnified
    const ySync = useTransform(
        distance,
        [-MAGNIFICATION_RANGE, 0, MAGNIFICATION_RANGE],
        [0, -8, 0]
    );
    const y = useSpring(ySync, { mass: 0.1, stiffness: 170, damping: 12 });

    return (
        <div className="relative flex items-end justify-center">
            <motion.button
                ref={ref}
                style={{ width: size, height: size, y }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onTouchStart={() => setHovered(true)}
                onTouchEnd={() => {
                    setHovered(false);
                    onClick?.();
                }}
                onClick={onClick}
                whileTap={{ scale: 0.85 }}
                className={`relative flex items-center justify-center rounded-[14px] transition-colors cursor-pointer ${isActive
                        ? "bg-gradient-to-b from-[#1a3a5c] to-[#0d2240] border border-[#3b82f6]/40 text-[#60a5fa] shadow-[0_0_12px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "bg-gradient-to-b from-[#1e2a3a] to-[#111827] border border-white/[0.06] text-[#94a3b8] hover:text-white"
                    }`}
            >
                {/* Active indicator dot */}
                {isActive && (
                    <motion.div
                        layoutId="activeDot"
                        className="absolute -bottom-[6px] w-[5px] h-[5px] rounded-full bg-[#60a5fa] shadow-[0_0_6px_rgba(96,165,250,0.6)]"
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                )}

                <div className="flex items-center justify-center h-full w-full">
                    <Icon className="w-[45%] h-[45%]" />
                </div>

                {/* Subtle glass reflection on hover */}
                <motion.div
                    className="absolute inset-0 rounded-[14px] pointer-events-none"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
                        opacity: hovered ? 1 : 0,
                        transition: 'opacity 0.2s',
                    }}
                />
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur-lg border border-white/[0.08] text-white text-[11px] font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                    >
                        {label}
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-black/80" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function DockSeparator({ mouseX }: { mouseX?: any }) {
    return (
        <div className="w-[1px] self-stretch my-2 bg-white/[0.08] mx-1" />
    );
}
