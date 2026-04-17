import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, Activity, Globe } from 'lucide-react';

// --- Shader Source ---
const vertexShader = `#version 300 es
layout(location = 0) in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
    vec2 mouse = (uMouse * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
    
    // Solar burst base
    float d = length(uv);
    float m = length(uv - mouse * 0.5);
    
    float pulse = sin(uTime * 0.5) * 0.1 + 0.9;
    float energy = 0.01 / (m * m + 0.01);
    
    // Dynamic solar flares
    float angle = atan(uv.y, uv.x);
    float glow = smoothstep(0.4, 0.0, d);
    float rays = pow(abs(sin(angle * 8.0 + uTime)), 10.0) * glow * 0.5;
    
    // Color palette
    vec3 c1 = vec3(0.01, 0.02, 0.05); // Deep Indigo/Space
    vec3 c2 = vec3(0.02, 0.15, 0.35); // Electric Blue
    vec3 c3 = vec3(1.0, 0.42, 0.1);  // Solar Orange
    vec3 c4 = vec3(1.0, 0.7, 0.2);   // Corona Amber
    
    vec3 color = mix(c1, c2, glow);
    color += c3 * energy * pulse;
    color += c4 * rays;
    
    // Vignette
    color *= 1.2 - d * 0.5;
    
    fragColor = vec4(color, 1.0);
}`;

// --- Hook for WebGL ---
function useShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    const program = gl.createProgram();
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!program || !vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'uTime');
    const uRes = gl.getUniformLocation(program, 'uResolution');
    const uMouse = gl.getUniformLocation(program, 'uMouse');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: canvas.height - e.clientY };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    resize();

    const animate = (time: number) => {
      gl.uniform1f(uTime, time * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return canvasRef;
}

const TrustBadge = ({ icon: Icon, text, delay }: { icon: any, text: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
  >
    <Icon className="w-4 h-4 text-[#FF6B1A]" />
    <span className="text-[10px] font-bold text-white/70 tracking-tighter uppercase whitespace-nowrap">{text}</span>
  </motion.div>
);

interface AnimatedShaderHeroProps {
  onCtaClick?: () => void;
  onSecondaryClick?: () => void;
}

export const AnimatedShaderHero: React.FC<AnimatedShaderHeroProps> = ({ 
  onCtaClick, 
  onSecondaryClick 
}) => {
  const canvasRef = useShaderBackground();

  return (
    <div className="relative w-full h-screen min-h-[700px] overflow-hidden flex items-center justify-center bg-black">
      {/* WebGL Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'brightness(1.1) contrast(1.1)' }}
      />
      
      {/* Subtle Overlay Image for Vibe */}
      <div 
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Atmospheric Shaders/Filters */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-70" />
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl">
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <TrustBadge icon={ShieldCheck} text="SEC Approved" delay={0.2} />
          <TrustBadge icon={Activity} text="NASA Data Partner" delay={0.3} />
          <TrustBadge icon={Globe} text="OSM Contributor" delay={0.4} />
        </div>

        {/* Headlines */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-6xl sm:text-7xl md:text-9xl font-[1000] text-white leading-[0.85] tracking-tighter mb-8">
            SOLAR<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B1A] via-[#FF8D4D] to-[#FFB347]">SCOPE</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed font-light tracking-tight">
            Next-gen rooftop intelligence powered by satellite photogrammetry. <br className="hidden md:block" />
            Analyze, visualize, and deploy solar at scale.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(255, 107, 26, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onCtaClick}
              className="group relative px-10 py-5 bg-[#FF6B1A] text-white rounded-2xl font-black text-xl overflow-hidden transition-all duration-500 w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="flex items-center gap-3">
                Analyze a rooftop <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onSecondaryClick}
              className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-xl backdrop-blur-3xl transition-all duration-300 w-full sm:w-auto border-opacity-20"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>

        {/* Floating Metrics Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/5 pt-10"
        >
          {[
            { label: "Precision", value: "99.8%" },
            { label: "Rooftops", value: "50M+" },
            { label: "Coverage", value: "Globe" },
            { label: "Response", value: "< 2s" }
          ].map((item, i) => (
            <div key={i} className="text-left">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{item.label}</div>
              <div className="text-2xl font-bold text-white tracking-tighter">{item.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <div className="w-px h-16 bg-gradient-to-b from-[#FF6B1A] to-transparent" />
          <span className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-medium">Ignite Progress</span>
        </motion.div>
      </div>

      {/* Ambient Radial Lights */}
      <div className="absolute top-1/4 -left-48 w-[600px] h-[600px] bg-[#FF6B1A]/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-[600px] h-[600px] bg-[#0A84FF]/5 blur-[160px] rounded-full pointer-events-none" />
    </div>
  );
};

export default AnimatedShaderHero;
