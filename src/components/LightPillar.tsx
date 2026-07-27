import React, { useRef, useEffect, useState, memo } from 'react';
import * as THREE from 'three';
import './LightPillar.css';

export interface LightPillarProps {
  topColor?: string;
  bottomColor?: string;
  intensity?: number;
  rotationSpeed?: number;
  interactive?: boolean;
  className?: string;
  glowAmount?: number;
  pillarWidth?: number;
  pillarHeight?: number;
  noiseIntensity?: number;
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
  pillarRotation?: number;
  quality?: 'low' | 'medium' | 'high';
}

const LightPillarComponent: React.FC<LightPillarProps> = ({
  topColor = '#5227FF',
  bottomColor = '#FF9FFC',
  intensity = 1.0,
  rotationSpeed = 0.3,
  interactive = false,
  className = '',
  glowAmount = 0.005,
  pillarWidth = 3.0,
  pillarHeight = 0.4,
  noiseIntensity = 0.5,
  mixBlendMode = 'screen',
  pillarRotation = 0,
  quality = 'high'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const targetMouseRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const timeRef = useRef<number>(0);
  const rotationSpeedRef = useRef<number>(rotationSpeed);
  const isVisibleRef = useRef<boolean>(true);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  // Store latest props in refs to avoid rebuilding the shader/renderer on prop changes
  const propsRef = useRef({
    topColor,
    bottomColor,
    intensity,
    rotationSpeed,
    interactive,
    glowAmount,
    pillarWidth,
    pillarHeight,
    noiseIntensity,
    pillarRotation
  });

  useEffect(() => {
    propsRef.current = {
      topColor,
      bottomColor,
      intensity,
      rotationSpeed,
      interactive,
      glowAmount,
      pillarWidth,
      pillarHeight,
      noiseIntensity,
      pillarRotation
    };
    rotationSpeedRef.current = rotationSpeed;
  }, [topColor, bottomColor, intensity, rotationSpeed, interactive, glowAmount, pillarWidth, pillarHeight, noiseIntensity, pillarRotation]);

  // Initial WebGL capability check
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // Main WebGL Setup - ONLY re-runs if quality or webGLSupported changes
  useEffect(() => {
    if (!containerRef.current || !webGLSupported) return;

    const container = containerRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndDevice = isMobile || (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4);

    let effectiveQuality = quality;
    if (isLowEndDevice && quality === 'high') effectiveQuality = 'medium';
    if (isMobile && quality !== 'low') effectiveQuality = 'low';

    // Capped pixel ratios & optimized step multipliers for stable 60FPS
    const qualitySettings = {
      low: { iterations: 20, waveIterations: 1, pixelRatio: 0.5, precision: 'mediump', stepMultiplier: 1.8 },
      medium: { iterations: 32, waveIterations: 2, pixelRatio: 0.75, precision: 'mediump', stepMultiplier: 1.4 },
      high: {
        iterations: 48,
        waveIterations: 3,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.25),
        precision: 'mediump',
        stepMultiplier: 1.2
      }
    };

    const settings = qualitySettings[effectiveQuality] || qualitySettings.medium;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
        precision: settings.precision as 'highp' | 'mediump' | 'lowp',
        stencil: false,
        depth: false
      });
    } catch {
      setWebGLSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(settings.pixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const parseColor = (hex: string) => {
      const color = new THREE.Color(hex);
      return new THREE.Vector3(color.r, color.g, color.b);
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision ${settings.precision} float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uIntensity;
      uniform bool uInteractive;
      uniform float uGlowAmount;
      uniform float uPillarWidth;
      uniform float uPillarHeight;
      uniform float uNoiseIntensity;
      uniform float uRotCos;
      uniform float uRotSin;
      uniform float uPillarRotCos;
      uniform float uPillarRotSin;
      uniform float uWaveSin;
      uniform float uWaveCos;
      varying vec2 vUv;

      const float STEP_MULT = ${settings.stepMultiplier.toFixed(1)};
      const int MAX_ITER = ${settings.iterations};
      const int WAVE_ITER = ${settings.waveIterations};

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
        uv = vec2(uPillarRotCos * uv.x - uPillarRotSin * uv.y, uPillarRotSin * uv.x + uPillarRotCos * uv.y);

        vec3 ro = vec3(0.0, 0.0, -10.0);
        vec3 rd = normalize(vec3(uv, 1.0));

        float rotC = uRotCos;
        float rotS = uRotSin;
        if(uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) {
          float a = uMouse.x * 6.283185;
          rotC = cos(a);
          rotS = sin(a);
        }

        vec3 col = vec3(0.0);
        float t = 0.1;
        
        for(int i = 0; i < MAX_ITER; i++) {
          vec3 p = ro + rd * t;
          p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);

          vec3 q = p;
          q.y = p.y * uPillarHeight + uTime;
          
          float freq = 1.0;
          float amp = 1.0;
          for(int j = 0; j < WAVE_ITER; j++) {
            q.xz = vec2(uWaveCos * q.x - uWaveSin * q.z, uWaveSin * q.x + uWaveCos * q.z);
            q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;
            freq *= 2.0;
            amp *= 0.5;
          }
          
          float d = length(cos(q.xz)) - 0.2;
          float bound = length(p.xz) - uPillarWidth;
          float k = 4.0;
          float h = max(k - abs(d - bound), 0.0);
          d = max(d, bound) + h * h * 0.0625 / k;
          d = abs(d) * 0.15 + 0.01;

          float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
          col += mix(uBottomColor, uTopColor, grad) / d;

          t += d * STEP_MULT;
          if(t > 45.0) break;
        }

        float widthNorm = uPillarWidth / 3.0;
        col = tanh(col * uGlowAmount / widthNorm);
        
        col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;
        
        gl_FragColor = vec4(col * uIntensity, 1.0);
      }
    `;

    const pillarRotRad = (propsRef.current.pillarRotation * Math.PI) / 180;
    const waveSin = Math.sin(0.4);
    const waveCos = Math.cos(0.4);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: mouseRef.current },
        uTopColor: { value: parseColor(propsRef.current.topColor) },
        uBottomColor: { value: parseColor(propsRef.current.bottomColor) },
        uIntensity: { value: propsRef.current.intensity },
        uInteractive: { value: propsRef.current.interactive },
        uGlowAmount: { value: propsRef.current.glowAmount },
        uPillarWidth: { value: propsRef.current.pillarWidth },
        uPillarHeight: { value: propsRef.current.pillarHeight },
        uNoiseIntensity: { value: propsRef.current.noiseIntensity },
        uRotCos: { value: 1.0 },
        uRotSin: { value: 0.0 },
        uPillarRotCos: { value: Math.cos(pillarRotRad) },
        uPillarRotSin: { value: Math.sin(pillarRotRad) },
        uWaveSin: { value: waveSin },
        uWaveCos: { value: waveCos }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    geometryRef.current = geometry;
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Optimized Mouse Move - zero DOM reads during handler
    let pendingMouseMove = false;
    let cachedRect: DOMRect | null = null;

    const updateCachedRect = () => {
      if (container) {
        cachedRect = container.getBoundingClientRect();
      }
    };
    updateCachedRect();

    const handleMouseMove = (event: MouseEvent) => {
      if (!propsRef.current.interactive) return;
      if (!cachedRect) updateCachedRect();
      if (!cachedRect) return;

      const x = ((event.clientX - cachedRect.left) / cachedRect.width) * 2 - 1;
      const y = -((event.clientY - cachedRect.top) / cachedRect.height) * 2 + 1;
      targetMouseRef.current.set(x, y);
      pendingMouseMove = true;
    };

    if (propsRef.current.interactive) {
      container.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Visibility Observer to halt animation when offscreen or hidden
    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? true;
        isVisibleRef.current = isIntersecting && !document.hidden;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Render loop locked to 60FPS with pause on offscreen
    let lastTime = performance.now();
    const targetFPS = effectiveQuality === 'low' ? 30 : 60;
    const frameTime = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      rafRef.current = requestAnimationFrame(animate);

      if (!isVisibleRef.current) return;
      if (!materialRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameTime) {
        // Smooth mouse lerp if interactive
        if (pendingMouseMove) {
          mouseRef.current.lerp(targetMouseRef.current, 0.15);
        }

        timeRef.current += 0.016 * rotationSpeedRef.current;
        const t = timeRef.current;
        materialRef.current.uniforms.uTime.value = t;
        materialRef.current.uniforms.uRotCos.value = Math.cos(t * 0.3);
        materialRef.current.uniforms.uRotSin.value = Math.sin(t * 0.3);

        rendererRef.current.render(sceneRef.current, cameraRef.current);
        lastTime = currentTime - (deltaTime % frameTime);
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    // Throttled Resize Listener
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        if (!rendererRef.current || !materialRef.current || !containerRef.current) return;
        const newWidth = containerRef.current.clientWidth || window.innerWidth;
        const newHeight = containerRef.current.clientHeight || window.innerHeight;
        rendererRef.current.setSize(newWidth, newHeight);
        materialRef.current.uniforms.uResolution.value.set(newWidth, newHeight);
        updateCachedRect();
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();

      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
      if (materialRef.current) materialRef.current.dispose();
      if (geometryRef.current) geometryRef.current.dispose();

      rendererRef.current = null;
      materialRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      geometryRef.current = null;
      rafRef.current = null;
    };
  }, [webGLSupported, quality]);

  // Imperative Uniform Updates - Updates GPU uniforms without rebuilding scene/canvas
  useEffect(() => {
    if (!materialRef.current) return;
    const parseColor = (hex: string) => {
      const color = new THREE.Color(hex);
      return new THREE.Vector3(color.r, color.g, color.b);
    };
    materialRef.current.uniforms.uTopColor.value = parseColor(topColor);
    materialRef.current.uniforms.uBottomColor.value = parseColor(bottomColor);
    materialRef.current.uniforms.uIntensity.value = intensity;
    materialRef.current.uniforms.uInteractive.value = interactive;
    materialRef.current.uniforms.uGlowAmount.value = glowAmount;
    materialRef.current.uniforms.uPillarWidth.value = pillarWidth;
    materialRef.current.uniforms.uPillarHeight.value = pillarHeight;
    materialRef.current.uniforms.uNoiseIntensity.value = noiseIntensity;

    const pillarRotRad = (pillarRotation * Math.PI) / 180;
    materialRef.current.uniforms.uPillarRotCos.value = Math.cos(pillarRotRad);
    materialRef.current.uniforms.uPillarRotSin.value = Math.sin(pillarRotRad);
  }, [topColor, bottomColor, intensity, interactive, glowAmount, pillarWidth, pillarHeight, noiseIntensity, pillarRotation]);

  if (!webGLSupported) {
    return (
      <div className={`light-pillar-fallback ${className}`} style={{ mixBlendMode }}>
        WebGL not supported
      </div>
    );
  }

  return <div ref={containerRef} className={`light-pillar-container ${className}`} style={{ mixBlendMode }} />;
};

export const LightPillar = memo(LightPillarComponent);
export default LightPillar;
