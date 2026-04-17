import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

gsap.registerPlugin(ScrollTrigger);

interface ThreeRefs {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  composer: EffectComposer | null;
  stars: THREE.Points[];
  nebula: THREE.Mesh | null;
  mountains: THREE.Mesh[];
  animationId: number | null;
  targetCameraX?: number;
  targetCameraY?: number;
  targetCameraZ?: number;
  locations?: number[];
}

interface HorizonHeroProps {
  onGetStarted?: () => void;
}

export const Component = ({ onGetStarted }: HorizonHeroProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const smoothCameraPos = useRef({ x: 0, y: 30, z: 100 });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const totalSections = 2;

  const threeRefs = useRef<ThreeRefs>({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    stars: [],
    nebula: null,
    mountains: [],
    animationId: null,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const initThree = () => {
      const refs = threeRefs.current;

      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025);

      refs.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
      refs.camera.position.z = 100;
      refs.camera.position.y = 20;

      refs.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true, alpha: true });
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 0.5;

      refs.composer = new EffectComposer(refs.renderer);
      refs.composer.addPass(new RenderPass(refs.scene, refs.camera));
      refs.composer.addPass(
        new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85)
      );

      createStarField();
      createNebula();
      createMountains();
      createAtmosphere();
      getLocation();
      animate();

      setIsReady(true);
    };

    const createStarField = () => {
      const refs = threeRefs.current;
      const starCount = 5000;

      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let j = 0; j < starCount; j++) {
          const radius = 200 + Math.random() * 800;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);

          positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[j * 3 + 2] = radius * Math.cos(phi);

          const color = new THREE.Color();
          const colorChoice = Math.random();
          if (colorChoice < 0.6) {
            color.setHSL(0, 0, 0.8 + Math.random() * 0.2);
          } else if (colorChoice < 0.85) {
            // amber-tinted stars
            color.setHSL(0.11, 0.7, 0.85);
          } else {
            // orange-tinted
            color.setHSL(0.07, 0.8, 0.8);
          }

          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;
          sizes[j] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 }, depth: { value: i } },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float depth;
            void main() {
              vColor = color;
              vec3 pos = position;
              float angle = time * 0.05 * (1.0 - depth * 0.3);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              pos.xy = rot * pos.xy;
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, opacity);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const stars = new THREE.Points(geometry, material);
        refs.scene!.add(stars);
        refs.stars.push(stars);
      }
    };

    // Solar-themed nebula: amber + orange instead of blue/pink
    const createNebula = () => {
      const refs = threeRefs.current;
      const geometry = new THREE.PlaneGeometry(8000, 4000, 100, 100);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color(0xf59e0b) }, // amber
          color2: { value: new THREE.Color(0xf97316) }, // orange
          opacity: { value: 0.25 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vElevation;
          uniform float time;
          void main() {
            vUv = uv;
            vec3 pos = position;
            float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
            pos.z += elevation;
            vElevation = elevation;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float opacity;
          uniform float time;
          varying vec2 vUv;
          varying float vElevation;
          void main() {
            float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
            vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
            alpha *= 1.0 + vElevation * 0.01;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.z = -1050;
      refs.scene!.add(nebula);
      refs.nebula = nebula;
    };

    const createMountains = () => {
      const refs = threeRefs.current;
      const layers = [
        { distance: -50, height: 60, color: 0x1a1a2e, opacity: 1 },
        { distance: -100, height: 80, color: 0x16213e, opacity: 0.8 },
        { distance: -150, height: 100, color: 0x0f3460, opacity: 0.6 },
        { distance: -200, height: 120, color: 0x0a4668, opacity: 0.4 },
      ];

      layers.forEach((layer, index) => {
        const points: THREE.Vector2[] = [];
        const segments = 50;

        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 1000;
          const y =
            Math.sin(i * 0.1) * layer.height +
            Math.sin(i * 0.05) * layer.height * 0.5 +
            Math.random() * layer.height * 0.2 -
            100;
          points.push(new THREE.Vector2(x, y));
        }
        points.push(new THREE.Vector2(5000, -300));
        points.push(new THREE.Vector2(-5000, -300));

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.DoubleSide,
        });

        const mountain = new THREE.Mesh(geometry, material);
        mountain.position.z = layer.distance;
        mountain.position.y = layer.distance;
        mountain.userData = { baseZ: layer.distance, index };
        refs.scene!.add(mountain);
        refs.mountains.push(mountain);
      });
    };

    const createAtmosphere = () => {
      const refs = threeRefs.current;
      const geometry = new THREE.SphereGeometry(600, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform float time;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            // Solar amber atmosphere
            vec3 atmosphere = vec3(0.96, 0.62, 0.04) * intensity;
            float pulse = sin(time * 2.0) * 0.1 + 0.9;
            atmosphere *= pulse;
            gl_FragColor = vec4(atmosphere, intensity * 0.2);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });
      refs.scene!.add(new THREE.Mesh(geometry, material));
    };

    const animate = () => {
      const refs = threeRefs.current;
      refs.animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      refs.stars.forEach((sf) => {
        const mat = sf.material as THREE.ShaderMaterial;
        if (mat.uniforms) mat.uniforms.time.value = time;
      });

      if (refs.nebula) {
        const mat = refs.nebula.material as THREE.ShaderMaterial;
        if (mat.uniforms) mat.uniforms.time.value = time * 0.5;
      }

      if (refs.camera && refs.targetCameraX !== undefined) {
        const s = 0.05;
        smoothCameraPos.current.x += (refs.targetCameraX - smoothCameraPos.current.x) * s;
        smoothCameraPos.current.y += (refs.targetCameraY! - smoothCameraPos.current.y) * s;
        smoothCameraPos.current.z += (refs.targetCameraZ! - smoothCameraPos.current.z) * s;

        refs.camera.position.x = smoothCameraPos.current.x + Math.sin(time * 0.1) * 2;
        refs.camera.position.y = smoothCameraPos.current.y + Math.cos(time * 0.15) * 1;
        refs.camera.position.z = smoothCameraPos.current.z;
        refs.camera.lookAt(0, 10, -600);
      }

      refs.mountains.forEach((mountain, i) => {
        const pf = 1 + i * 0.5;
        mountain.position.x = Math.sin(time * 0.1) * 2 * pf;
        mountain.position.y = 50 + Math.cos(time * 0.15) * 1 * pf;
      });

      if (refs.composer) refs.composer.render();
    };

    initThree();

    const handleResize = () => {
      const refs = threeRefs.current;
      if (refs.camera && refs.renderer && refs.composer) {
        refs.camera.aspect = window.innerWidth / window.innerHeight;
        refs.camera.updateProjectionMatrix();
        refs.renderer.setSize(window.innerWidth, window.innerHeight);
        refs.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      const refs = threeRefs.current;
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      window.removeEventListener('resize', handleResize);
      refs.stars.forEach((sf) => { sf.geometry.dispose(); (sf.material as THREE.Material).dispose(); });
      refs.mountains.forEach((m) => { m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
      if (refs.nebula) { refs.nebula.geometry.dispose(); (refs.nebula.material as THREE.Material).dispose(); }
      if (refs.renderer) refs.renderer.dispose();
    };
  }, []);

  const getLocation = () => {
    const refs = threeRefs.current;
    refs.locations = refs.mountains.map((m) => m.position.z);
  };

  // GSAP entrance animations
  useEffect(() => {
    if (!isReady) return;

    gsap.set([menuRef.current, titleRef.current, subtitleRef.current, scrollProgressRef.current], {
      autoAlpha: 1,
    });

    const tl = gsap.timeline();

    if (menuRef.current) {
      tl.from(menuRef.current, { x: -100, autoAlpha: 0, duration: 1, ease: 'power3.out' });
    }
    if (titleRef.current) {
      tl.from(titleRef.current.querySelectorAll('.title-char'), {
        y: 200, autoAlpha: 0, duration: 1.5, stagger: 0.05, ease: 'power4.out',
      }, '-=0.5');
    }
    if (subtitleRef.current) {
      tl.from(subtitleRef.current.querySelectorAll('.subtitle-line'), {
        y: 50, autoAlpha: 0, duration: 1, stagger: 0.2, ease: 'power3.out',
      }, '-=0.8');
    }
    if (scrollProgressRef.current) {
      tl.from(scrollProgressRef.current, { autoAlpha: 0, y: 50, duration: 1, ease: 'power2.out' }, '-=0.5');
    }

    return () => { tl.kill(); };
  }, [isReady]);

  // Scroll + camera handler — progress is relative to the hero container
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroEl = containerRef.current;
      const heroTop = heroEl ? heroEl.offsetTop : 0;
      const heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight * 3;
      const progress = Math.min(Math.max((scrollY - heroTop) / heroHeight, 0), 1);
      const isPastHero = scrollY > heroTop + heroHeight;

      setScrollProgress(progress);
      setCurrentSection(Math.floor(progress * totalSections));

      // Hide all fixed hero elements when scrolled past the hero zone
      const fixedEls = [menuRef.current, titleRef.current?.parentElement, scrollProgressRef.current];
      fixedEls.forEach(el => { if (el) (el as HTMLElement).style.opacity = isPastHero ? '0' : ''; });
      if (canvasRef.current) canvasRef.current.style.opacity = isPastHero ? '0' : '1';

      const refs = threeRefs.current;
      const totalProgress = progress * totalSections;
      const sectionProgress = totalProgress % 1;
      const newSection = Math.floor(totalProgress);

      const cameraPositions = [
        { x: 0, y: 30, z: 300 },
        { x: 0, y: 40, z: -50 },
        { x: 0, y: 50, z: -700 },
      ];

      const cur = cameraPositions[newSection] ?? cameraPositions[0];
      const nxt = cameraPositions[newSection + 1] ?? cur;

      refs.targetCameraX = cur.x + (nxt.x - cur.x) * sectionProgress;
      refs.targetCameraY = cur.y + (nxt.y - cur.y) * sectionProgress;
      refs.targetCameraZ = cur.z + (nxt.z - cur.z) * sectionProgress;

      refs.mountains.forEach((mountain, i) => {
        const speed = 1 + i * 0.9;
        if (refs.nebula) {
          refs.nebula.position.z = (mountain.userData.baseZ + scrollY * speed * 0.5 + progress * speed * 0.01) - 100;
        }
        mountain.position.z = progress > 0.7 ? 600000 : (refs.locations?.[i] ?? mountain.userData.baseZ);
      });

      if (refs.nebula && refs.mountains[3]) {
        refs.nebula.position.z = refs.mountains[3].position.z;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  const sectionContent = [
    {
      title: 'SOLARSCOPE',
      line1: 'AI-powered solar potential analysis',
      line2: 'for every rooftop on the planet',
    },
    {
      title: 'ANALYZE',
      line1: 'Upload your roof image and let our AI',
      line2: 'calculate your exact solar yield potential',
    },
    {
      title: 'OPTIMIZE',
      line1: 'Precision placement maps, savings estimates,',
      line2: 'and installation-ready reports — in seconds',
    },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative', background: '#04040a', minHeight: '300vh' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />

      {/* Side menu */}
      <div
        ref={menuRef}
        style={{
          visibility: 'hidden',
          position: 'fixed',
          left: 32,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ display: 'block', width: 24, height: 1.5, background: 'rgba(245,158,11,0.7)', borderRadius: 1 }} />
          ))}
        </div>
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            color: 'rgba(245,158,11,0.5)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 500,
            marginTop: 8,
          }}
        >
          SOLAR
        </div>
      </div>

      {/* Hero content — fixed while scrolling */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <h1
          ref={titleRef}
          style={{
            visibility: 'hidden',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(4rem, 10vw, 9rem)',
            letterSpacing: '0.06em',
            lineHeight: 0.95,
            color: '#eeeef5',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          {sectionContent[currentSection]?.title.split('').map((char, i) => (
            <span
              key={i}
              className="title-char"
              style={{
                display: 'inline-block',
                color: 'transparent',
                backgroundImage:
                  currentSection === 0
                    ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #fbbf24 100%)'
                    : 'linear-gradient(135deg, #f59e0b, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>

        <div
          ref={subtitleRef}
          style={{ visibility: 'hidden', textAlign: 'center', marginTop: 20 }}
        >
          <p className="subtitle-line" style={{ fontSize: '1rem', color: '#6a6a82', letterSpacing: '0.04em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 300 }}>
            {sectionContent[currentSection]?.line1}
          </p>
          <p className="subtitle-line" style={{ fontSize: '1rem', color: '#6a6a82', letterSpacing: '0.04em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 300, marginTop: 6 }}>
            {sectionContent[currentSection]?.line2}
          </p>
          {currentSection === 0 && onGetStarted && (
            <button
              onClick={onGetStarted}
              style={{
                pointerEvents: 'all',
                marginTop: 36,
                padding: '14px 40px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: '#000',
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: "'IBM Plex Sans', sans-serif",
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.25s, box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px) scale(1.02)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 16px 40px rgba(245,158,11,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
              }}
            >
              Analyze My Roof
            </button>
          )}
        </div>
      </div>

      {/* Scroll progress */}
      <div
        ref={scrollProgressRef}
        style={{
          visibility: 'hidden',
          position: 'fixed',
          bottom: 32,
          right: 40,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(245,158,11,0.5)', fontFamily: "'IBM Plex Mono', monospace" }}>
          SCROLL
        </div>
        <div style={{ width: 80, height: 1, background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${scrollProgress * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)', transition: 'width 0.1s' }} />
        </div>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(245,158,11,0.4)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {String(currentSection + 1).padStart(2, '0')} / {String(totalSections).padStart(2, '0')}
        </div>
      </div>

      {/* Scroll spacer sections */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {[...Array(totalSections + 1)].map((_, i) => (
          <section key={i} style={{ height: '100vh' }} />
        ))}
      </div>
    </div>
  );
};
