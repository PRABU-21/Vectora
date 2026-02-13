import { useEffect, useRef } from "react";

const scriptSrc = "https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js";

const particleConfig = {
  particles: {
    number: { value: 55, density: { enable: true, value_area: 800 } },
    color: { value: "#ffffff" }, // ✨ bright white
    shape: { type: "circle" },
    opacity: { value: 0.8 },
    size: { value: 4.5, random: true },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#e5e7eb", // ✨ light lines
      opacity: 0.4,
      width: 1.2,
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      out_mode: "out",
    },
  },
  interactivity: {
    events: {
      onhover: { enable: true, mode: "repulse" },
      onclick: { enable: true, mode: "push" },
    },
  },
  retina_detect: true,
};

const ParticlesBackground = ({ id = "dashboard-hero-particles", className = "opacity-80" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let script;

    const initParticles = () => {
      if (!window.particlesJS || !containerRef.current) return;
      window.particlesJS(id, particleConfig);
    };

    if (!window.particlesJS) {
      script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.onload = initParticles;
      script.onerror = () => console.error("Particles.js failed to load");
      document.body.appendChild(script);
    } else {
      initParticles();
    }

    return () => {
      const canvas = containerRef.current?.querySelector("canvas");
      if (canvas) canvas.remove();
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [id]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
};

export default ParticlesBackground;
