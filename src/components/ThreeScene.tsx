import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { cn } from '../lib/utils';

interface SceneProps {
  type: 'hero' | 'ambient' | 'vault' | 'mempool' | 'matching';
  className?: string;
  opacity?: number;
}

const TARGET_FPS = 30;

function disposeObjectResources(root: THREE.Object3D) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;

    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (!material) {
      return;
    }

    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
      return;
    }

    material.dispose();
  });
}

export function ThreeScene({ type, className, opacity = 1 }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const inViewRef = useRef(true);
  const pageVisibleRef = useRef(typeof document === 'undefined' ? true : !document.hidden);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.matchMedia('(max-width: 1024px)').matches;
    const lowPowerMode = prefersReducedMotion || isSmallScreen;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPowerMode,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerMode ? 1 : 1.25));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight('#0a1520', 0.4);
    const keyLight = new THREE.PointLight('#1fd6c8', 1.6, 20);
    keyLight.position.set(-4, 4, 6);
    const fillLight = new THREE.PointLight('#0a2040', 0.7, 15);
    fillLight.position.set(5, -2, 3);
    scene.add(ambientLight, keyLight, fillLight);

    const mainObject = new THREE.Group();

    if (type === 'hero' || type === 'vault') {
      const detail = type === 'hero' ? (lowPowerMode ? 1 : 2) : lowPowerMode ? 2 : 3;
      const geometry = new THREE.IcosahedronGeometry(2, detail);
      const material = new THREE.MeshStandardMaterial({
        color: '#1fd6c8',
        emissive: '#0a4a44',
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.8,
        wireframe: true,
      });
      const sphere = new THREE.Mesh(geometry, material);
      mainObject.add(sphere);

      const ringGeo = new THREE.TorusGeometry(3, 0.02, 12, lowPowerMode ? 64 : 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: '#1fd6c8',
        transparent: true,
        opacity: 0.2,
      });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      const ring2 = new THREE.Mesh(ringGeo, ringMat);
      ring2.rotation.x = Math.PI / 2;
      mainObject.add(ring1, ring2);
    } else if (type === 'ambient') {
      const cubeCount = lowPowerMode ? 12 : 22;
      for (let i = 0; i < cubeCount; i++) {
        const size = 0.05 + Math.random() * 0.15;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshBasicMaterial({
          color: '#1fd6c8',
          transparent: true,
          opacity: 0.05 + Math.random() * 0.1,
        });
        const cube = new THREE.Mesh(geometry, material);

        cube.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10,
        );

        cube.userData = {
          rotationSpeed: {
            x: Math.random() * 0.01,
            y: Math.random() * 0.01,
          },
          baseY: cube.position.y,
          phase: Math.random() * Math.PI * 2,
        };

        mainObject.add(cube);
      }
    } else if (type === 'mempool') {
      const particlesCount = lowPowerMode ? 350 : 700;
      const positions = new Float32Array(particlesCount * 3);

      for (let i = 0; i < positions.length; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
      }

      const particlesGeo = new THREE.BufferGeometry();
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const particlesMat = new THREE.PointsMaterial({
        size: lowPowerMode ? 0.025 : 0.02,
        color: '#f97316',
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      });

      const particles = new THREE.Points(particlesGeo, particlesMat);
      mainObject.add(particles);
    } else if (type === 'matching') {
      const segments = lowPowerMode ? 16 : 24;
      const geometry = new THREE.SphereGeometry(0.5, segments, segments);
      const materialOne = new THREE.MeshStandardMaterial({
        color: '#1fd6c8',
        emissive: '#1fd6c8',
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      });
      const materialTwo = new THREE.MeshStandardMaterial({
        color: '#a855f7',
        emissive: '#a855f7',
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      });

      const sphere1 = new THREE.Mesh(geometry, materialOne);
      const sphere2 = new THREE.Mesh(geometry, materialTwo);
      sphere1.position.x = -3;
      sphere2.position.x = 3;
      mainObject.add(sphere1, sphere2);

      const shieldGeo = new THREE.IcosahedronGeometry(1.2, lowPowerMode ? 1 : 2);
      const shieldMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        wireframe: true,
        transparent: true,
        opacity: 0,
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      mainObject.add(shield);
    }

    scene.add(mainObject);

    const frameInterval = 1000 / TARGET_FPS;

    const renderFrame = (timeMs: number) => {
      frameIdRef.current = requestAnimationFrame(renderFrame);

      const elapsedSinceLastFrame = timeMs - lastFrameTimeRef.current;
      if (elapsedSinceLastFrame < frameInterval) {
        return;
      }

      const deltaSeconds = elapsedSinceLastFrame / 1000;
      const frameScale = deltaSeconds * 60;
      const elapsed = timeMs * 0.001;
      lastFrameTimeRef.current = timeMs;

      if (type === 'hero' || type === 'vault') {
        mainObject.rotation.y += 0.002 * frameScale;
        mainObject.rotation.x += 0.001 * frameScale;
      } else if (type === 'ambient') {
        mainObject.children.forEach((child) => {
          const speed = child.userData.rotationSpeed as { x: number; y: number };
          const baseY = child.userData.baseY as number;
          const phase = child.userData.phase as number;

          child.rotation.x += speed.x * frameScale;
          child.rotation.y += speed.y * frameScale;
          child.position.y = baseY + Math.sin(elapsed * 1.2 + phase) * 0.35;
        });
      } else if (type === 'mempool') {
        mainObject.rotation.y += 0.0008 * frameScale;
        const points = mainObject.children[0] as THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
        points.material.opacity = 0.5 + Math.sin(elapsed * 0.7) * 0.08;
      } else if (type === 'matching') {
        const sphere1 = mainObject.children[0] as THREE.Mesh;
        const sphere2 = mainObject.children[1] as THREE.Mesh;
        const shield = mainObject.children[2] as THREE.Mesh;

        const cycle = (Math.sin(elapsed) + 1) / 2;
        sphere1.position.x = -3 + cycle * 3;
        sphere2.position.x = 3 - cycle * 3;

        const shieldMaterial = shield.material as THREE.MeshStandardMaterial;
        if (cycle > 0.9) {
          shield.scale.setScalar(1 + (cycle - 0.9) * 5);
          shieldMaterial.opacity = (cycle - 0.9) * 10;
        } else {
          shieldMaterial.opacity = 0;
        }

        mainObject.rotation.y += 0.01 * frameScale;
      }

      renderer.render(scene, camera);
    };

    const startLoop = () => {
      if (frameIdRef.current !== null) {
        return;
      }

      lastFrameTimeRef.current = performance.now();
      frameIdRef.current = requestAnimationFrame(renderFrame);
    };

    const stopLoop = () => {
      if (frameIdRef.current === null) {
        return;
      }

      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    };

    const syncAnimationState = () => {
      const shouldAnimate = inViewRef.current && pageVisibleRef.current;
      if (shouldAnimate) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    renderer.render(scene, camera);

    const observer = new IntersectionObserver(
      (entries) => {
        inViewRef.current = entries.some((entry) => entry.isIntersecting);
        syncAnimationState();
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.01,
      },
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      pageVisibleRef.current = !document.hidden;
      syncAnimationState();
    };

    let resizeFrameId: number | null = null;
    const handleResize = () => {
      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = requestAnimationFrame(() => {
        resizeFrameId = null;

        const host = containerRef.current;
        if (!host) {
          return;
        }

        const nextWidth = Math.max(host.clientWidth, 1);
        const nextHeight = Math.max(host.clientHeight, 1);

        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerMode ? 1 : 1.25));
        renderer.setSize(nextWidth, nextHeight);
        renderer.render(scene, camera);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize, { passive: true });

    syncAnimationState();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();

      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
      }

      stopLoop();
      disposeObjectResources(scene);
      scene.clear();

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [type]);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{ opacity }}
    />
  );
}
