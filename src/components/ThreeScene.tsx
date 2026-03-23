import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { cn } from '../lib/utils';

interface SceneProps {
  type: 'hero' | 'ambient' | 'vault' | 'mempool' | 'matching';
  className?: string;
  opacity?: number;
}

export function ThreeScene({ type, className, opacity = 1 }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight('#0a1520', 0.4);
    const keyLight = new THREE.PointLight('#1fd6c8', 2.0, 20);
    keyLight.position.set(-4, 4, 6);
    const fillLight = new THREE.PointLight('#0a2040', 0.8, 15);
    fillLight.position.set(5, -2, 3);
    scene.add(ambientLight, keyLight, fillLight);

    // Objects based on type
    let mainObject: THREE.Group = new THREE.Group();
    
    if (type === 'hero' || type === 'vault') {
      const geometry = new THREE.IcosahedronGeometry(2, type === 'hero' ? 2 : 4);
      const material = new THREE.MeshStandardMaterial({
        color: '#1fd6c8',
        emissive: '#0a4a44',
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.8,
        wireframe: true
      });
      const sphere = new THREE.Mesh(geometry, material);
      mainObject.add(sphere);

      // Add orbiting rings
      const ringGeo = new THREE.TorusGeometry(3, 0.02, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color: '#1fd6c8', transparent: true, opacity: 0.2 });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      const ring2 = new THREE.Mesh(ringGeo, ringMat);
      ring2.rotation.x = Math.PI / 2;
      mainObject.add(ring1, ring2);
    } else if (type === 'ambient') {
      for (let i = 0; i < 25; i++) {
        const size = 0.05 + Math.random() * 0.15;
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshBasicMaterial({ 
          color: '#1fd6c8', 
          transparent: true, 
          opacity: 0.05 + Math.random() * 0.1 
        });
        const cube = new THREE.Mesh(geo, mat);
        cube.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10
        );
        cube.userData = { 
          rotationSpeed: {
            x: Math.random() * 0.02,
            y: Math.random() * 0.02,
            z: Math.random() * 0.02
          },
          floatSpeed: 0.001 + Math.random() * 0.002
        };
        mainObject.add(cube);
      }
    } else if (type === 'mempool') {
      // Particle system for mempool
      const particlesCount = 1000;
      const posArray = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
      }
      const particlesGeo = new THREE.BufferGeometry();
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particlesMat = new THREE.PointsMaterial({
        size: 0.02,
        color: '#f97316', // Orange for the "exposed" mempool
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const particles = new THREE.Points(particlesGeo, particlesMat);
      mainObject.add(particles);
    } else if (type === 'matching') {
      // Two spheres moving towards each other
      const geo = new THREE.SphereGeometry(0.5, 32, 32);
      const mat1 = new THREE.MeshStandardMaterial({ color: '#1fd6c8', emissive: '#1fd6c8', emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });
      const mat2 = new THREE.MeshStandardMaterial({ color: '#a855f7', emissive: '#a855f7', emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });
      
      const sphere1 = new THREE.Mesh(geo, mat1);
      const sphere2 = new THREE.Mesh(geo, mat2);
      
      sphere1.position.x = -3;
      sphere2.position.x = 3;
      
      mainObject.add(sphere1, sphere2);

      // Add a central "shield" that appears when they meet
      const shieldGeo = new THREE.IcosahedronGeometry(1.2, 2);
      const shieldMat = new THREE.MeshStandardMaterial({ 
        color: '#ffffff', 
        wireframe: true, 
        transparent: true, 
        opacity: 0 
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      mainObject.add(shield);
    }

    scene.add(mainObject);

    // Animation
    const animate = () => {
      if (mainObject) {
        if (type === 'hero' || type === 'vault') {
          mainObject.rotation.y += 0.002;
          mainObject.rotation.x += 0.001;
        } else if (type === 'ambient') {
          mainObject.children.forEach(child => {
            child.rotation.x += child.userData.rotationSpeed.x;
            child.rotation.y += child.userData.rotationSpeed.y;
            child.position.y += Math.sin(Date.now() * 0.001 + child.position.x) * child.userData.floatSpeed;
          });
        } else if (type === 'mempool') {
          mainObject.rotation.y += 0.001;
          const points = mainObject.children[0] as THREE.Points;
          const positions = points.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i+1] += Math.sin(Date.now() * 0.001 + positions[i]) * 0.005;
          }
          points.geometry.attributes.position.needsUpdate = true;
        } else if (type === 'matching') {
          const s1 = mainObject.children[0] as THREE.Mesh;
          const s2 = mainObject.children[1] as THREE.Mesh;
          const shield = mainObject.children[2] as THREE.Mesh;
          
          const time = Date.now() * 0.001;
          const cycle = (Math.sin(time) + 1) / 2; // 0 to 1
          
          s1.position.x = -3 + (cycle * 3);
          s2.position.x = 3 - (cycle * 3);
          
          if (cycle > 0.9) {
            shield.scale.setScalar(1 + (cycle - 0.9) * 5);
            (shield.material as THREE.MeshStandardMaterial).opacity = (cycle - 0.9) * 10;
          } else {
            (shield.material as THREE.MeshStandardMaterial).opacity = 0;
          }
          
          mainObject.rotation.y += 0.01;
        }
      }
      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        containerRef.current?.removeChild(rendererRef.current.domElement);
      }
    };
  }, [type]);

  return (
    <div 
      ref={containerRef} 
      className={cn("absolute inset-0 pointer-events-none", className)} 
      style={{ opacity }}
    />
  );
}
