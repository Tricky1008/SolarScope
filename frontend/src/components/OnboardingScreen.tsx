import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { MapPin, Calculator, ArrowRight, Sun } from 'lucide-react';

interface Props {
    onSelectFlow: (flow: 'choice' | 'map' | 'manual') => void;
}

export default function OnboardingScreen({ onSelectFlow }: Props) {
    const [hoveredCard, setHoveredCard] = useState<'map' | 'manual' | null>(null);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden min-h-screen">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-electric-blue/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-solar-orange/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl w-full z-10"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-4 bg-surface/50 border border-divider rounded-full mb-6 backdrop-blur-md">
                        <Sun className="w-10 h-10 text-solar-orange" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Design Your <span className="text-electric-blue">Solar Future</span>
                    </h1>
                    <p className="text-lg text-text-secondary max-w-xl mx-auto">
                        Calculate savings, discover your rooftop's potential, and generate institutional-grade financial projections in seconds.
                    </p>
                </motion.div>

                {/* Options Grid */}
                <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">

                    {/* Map Flow Card */}
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onHoverStart={() => setHoveredCard('map')}
                        onHoverEnd={() => setHoveredCard(null)}
                        onClick={() => {
                            onSelectFlow('map');
                            localStorage.setItem('solarscope-onboarded', 'true');
                        }}
                        className="group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden bg-surface"
                        style={{
                            borderColor: hoveredCard === 'map' ? 'var(--electric-blue)' : 'var(--divider)',
                            boxShadow: hoveredCard === 'map' ? '0 20px 40px -10px rgba(56,189,248,0.2)' : 'none'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className={`w - 14 h - 14 rounded - xl flex items - center justify - center mb - 6 transition - colors ${hoveredCard === 'map' ? 'bg-electric-blue/20 text-electric-blue' : 'bg-[#1e293b] text-text-secondary'} `}>
                            <MapPin className="w-7 h-7" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                            Locate on Map
                            <ArrowRight className={`w - 5 h - 5 transition - transform duration - 300 ${hoveredCard === 'map' ? 'translate-x-1 text-electric-blue' : 'opacity-0 -translate-x-2'} `} />
                        </h3>

                        <p className="text-text-secondary leading-relaxed">
                            Auto-detect your rooftop dimensions using our satellite machine learning models for instant analysis.
                        </p>
                    </motion.button>

                    {/* Manual Flow Card */}
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onHoverStart={() => setHoveredCard('manual')}
                        onHoverEnd={() => setHoveredCard(null)}
                        onClick={() => {
                            onSelectFlow('manual');
                            localStorage.setItem('solarscope-onboarded', 'true');
                        }}
                        className="group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden bg-surface"
                        style={{
                            borderColor: hoveredCard === 'manual' ? 'var(--solar-orange)' : 'var(--divider)',
                            boxShadow: hoveredCard === 'manual' ? '0 20px 40px -10px rgba(249,115,22,0.2)' : 'none'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-solar-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className={`w - 14 h - 14 rounded - xl flex items - center justify - center mb - 6 transition - colors ${hoveredCard === 'manual' ? 'bg-solar-orange/20 text-solar-orange' : 'bg-[#1e293b] text-text-secondary'} `}>
                            <Calculator className="w-7 h-7" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                            Manual Entry
                            <ArrowRight className={`w - 5 h - 5 transition - transform duration - 300 ${hoveredCard === 'manual' ? 'translate-x-1 text-solar-orange' : 'opacity-0 -translate-x-2'} `} />
                        </h3>

                        <p className="text-text-secondary leading-relaxed">
                            Already know your measurements? Enter them directly for highly specific projections.
                        </p>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
