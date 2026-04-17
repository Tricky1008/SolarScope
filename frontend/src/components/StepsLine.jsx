import { useEffect, useRef } from "react";

const StepsLine = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W, H;
    let raf;
    let mounted = true;

    const COLORS = {
      amber: "#f59e0b",
      orange: "#f97316",
      cyan: "#22d3ee",
      green: "#4ade80"
    };

    const points = [];
    const stepCount = 10;
    const padding = 100;

    const resize = () => {
      if (!mounted || !canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      W = canvas.width = parent.clientWidth;
      H = canvas.height = parent.clientHeight || 1000;

      // Re-generate points on resize
      points.length = 0;
      for (let i = 0; i <= stepCount; i++) {
        points.push({
          x: W / 2 + Math.sin(i * 1.5) * 40,
          y: padding + ((H - padding * 2) / stepCount) * i
        });
      }
    };

    const draw = () => {
      if (!mounted || !W || !H || points.length === 0) return;
      
      ctx.clearRect(0, 0, W, H);
      
      // Draw smooth path
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i-1].x) / 2;
        const yc = (points[i].y + points[i-1].y) / 2;
        ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
      }
      
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.2, COLORS.amber);
      grad.addColorStop(0.5, COLORS.orange);
      grad.addColorStop(0.8, COLORS.cyan);
      grad.addColorStop(1, "transparent");
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.stroke();

      // Animating symbols on the line
      const time = Date.now() * 0.001;
      points.forEach((p, i) => {
          if (i === 0 || i === points.length - 1) return;
          const bounce = Math.sin(time + i) * 10;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y + bounce, 4, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? COLORS.amber : COLORS.cyan;
          ctx.fill();
          
          // Glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = i % 2 === 0 ? COLORS.amber : COLORS.cyan;
          ctx.stroke();
          ctx.shadowBlur = 0;
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      mounted = false;
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: "absolute", 
        inset: 0, 
        width: "100%", 
        height: "100%", 
        pointerEvents: "none", 
        zIndex: 1 
      }} 
    />
  );
};

export default StepsLine;
