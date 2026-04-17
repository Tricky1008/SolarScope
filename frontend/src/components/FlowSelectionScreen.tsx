import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { MapPin, Calculator, ArrowRight, Sun } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const SPRING: any = { type: "spring", stiffness: 300, damping: 20 };
const BOUNCE_SPRING: any = { type: "spring", stiffness: 400, damping: 15, mass: 0.8 };

const STAGGER_CONTAINER: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const FADE_UP: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: BOUNCE_SPRING }
};

export default function FlowSelectionScreen() {
    const [hoveredCard, setHoveredCard] = useState<'map' | 'manual' | null>(null);
    const { setActiveFlow } = useAppStore();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden min-h-[100dvh] bg-[#060B12] font-['DM_Sans',sans-serif] ss-root pb-24">
            {/* BEAUTIFUL MINIMAL BACKGROUND IMAGE */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1508514177221-188b1c77eca2?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.15,
                    filter: 'grayscale(100%) contrast(120%) brightness(80%)'
                }}
            />
            {/* GRADIENT OVERLAY FOR TEXT READABILITY */}
            <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#060B12]/80 via-[#060B12]/60 to-[#060B12]" />

            {/* NOISE & GRID */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.25] z-0"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
                }}
            />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* DYNAMIC ORBS TRACKING MOUSE */}
            <motion.div
                className="absolute w-[600px] h-[600px] bg-[#FF6B1A]/10 rounded-full blur-[120px] pointer-events-none"
                animate={{
                    x: mousePos.x - 300,
                    y: mousePos.y - 300,
                }}
                transition={{ type: "tween", ease: "circOut", duration: 1.5 }}
            />
            <motion.div
                className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-[#0A84FF]/10 rounded-full blur-[100px] pointer-events-none"
                animate={{
                    x: mousePos.x * -0.2,
                    y: mousePos.y * -0.2,
                }}
                transition={{ type: "tween", ease: "circOut", duration: 2 }}
            />

            {/* Central glowing static orb for depth */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-solar-orange/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="show"
                className="max-w-4xl w-full z-10"
            >
                {/* Header */}
                <motion.div variants={FADE_UP} className="text-center mb-12">
                    <motion.div
                        whileHover={{ rotate: 90, scale: 1.1 }}
                        transition={SPRING}
                        className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-[#FF6B1A] to-[#FF9A5C] md:w-16 md:h-16 w-14 h-14 rounded-2xl mb-6 shadow-[0_0_20px_rgba(255,107,26,0.4)]"
                    >
                        <Sun className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em' }}>
                        DESIGN YOUR <span className="text-[#FF6B1A]">SOLAR FUTURE</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto font-mono">
                        Choose your preferred method to calculate savings and discover your rooftop's potential.
                    </p>
                </motion.div>

                {/* Options Grid */}
                <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
                    {/* Map Flow Card */}
                    <motion.button
                        variants={FADE_UP}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING}
                        onHoverStart={() => setHoveredCard('map')}
                        onHoverEnd={() => setHoveredCard(null)}
                        onClick={() => setActiveFlow('map')}
                        className="group relative p-8 rounded-2xl border transition-colors duration-300 text-left overflow-hidden bg-[#0A111C]/60 backdrop-blur-xl cursor-pointer"
                        style={{
                            borderColor: hoveredCard === 'map' ? 'rgba(10, 132, 255, 0.5)' : '#1E3550',
                            boxShadow: hoveredCard === 'map' ? '0 20px 40px -10px rgba(10, 132, 255, 0.2)' : 'none'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 ${hoveredCard === 'map' ? 'bg-[#0A84FF]/20 text-[#0A84FF]' : 'bg-[#1E3550] text-gray-400'}`}>
                            <MapPin className="w-7 h-7" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2" style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.02em' }}>
                            LOCATE ON MAP
                            <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'map' ? 'translate-x-1 text-[#0A84FF]' : 'opacity-0 -translate-x-2'}`} />
                        </h3>

                        <p className="text-gray-400 leading-relaxed text-sm">
                            Auto-detect your rooftop dimensions using our satellite machine learning models for instant analysis.
                        </p>
                    </motion.button>

                    {/* Manual Flow Card */}
                    <motion.button
                        variants={FADE_UP}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING}
                        onHoverStart={() => setHoveredCard('manual')}
                        onHoverEnd={() => setHoveredCard(null)}
                        onClick={() => setActiveFlow('manual')}
                        className="group relative p-8 rounded-2xl border transition-colors duration-300 text-left overflow-hidden bg-[#0A111C]/60 backdrop-blur-xl cursor-pointer"
                        style={{
                            borderColor: hoveredCard === 'manual' ? 'rgba(255, 107, 26, 0.5)' : '#1E3550',
                            boxShadow: hoveredCard === 'manual' ? '0 20px 40px -10px rgba(255, 107, 26, 0.2)' : 'none'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B1A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 ${hoveredCard === 'manual' ? 'bg-[#FF6B1A]/20 text-[#FF6B1A]' : 'bg-[#1E3550] text-gray-400'}`}>
                            <Calculator className="w-7 h-7" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2" style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.02em' }}>
                            MANUAL ENTRY
                            <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${hoveredCard === 'manual' ? 'translate-x-1 text-[#FF6B1A]' : 'opacity-0 -translate-x-2'}`} />
                        </h3>

                        <p className="text-gray-400 leading-relaxed text-sm">
                            Already know your measurements? Enter them directly for highly specific projections without searching on map.
                        </p>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
