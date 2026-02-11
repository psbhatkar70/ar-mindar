import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MINDAR_URL = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mindarInstance: any;

    const startAR = async () => {
      // @ts-ignore
      const { MindARThree } = await import(/* @vite-ignore */ MINDAR_URL);

      if (!containerRef.current) return;

      mindarInstance = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/target/targets.mind", 
        uiScanning: "yes", 
        
        // --- RIGOROUS STABILITY TWEAKS ---
        // We tighten these to the limit for the S24's high-res camera
        filterMinCF: 0.00001, // Extreme smoothing for jitter
        filterBeta: 0.005,    // Balances lag vs smoothness
        missTolerance: 10,    // Keeps model visible during fast phone moves
        warmupTolerance: 7,   // Ensures a "solid lock" before showing model
      });

      const { renderer, scene, camera } = mindarInstance;
      renderer.setClearColor(0x000000, 0); 
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Lighting Calibration
      const ambient = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xffffff, 2);
      sun.position.set(1, 10, 1); 
      scene.add(sun);

      const anchor = mindarInstance.addAnchor(0);

      const loader = new GLTFLoader();
      loader.load("/model/cake.glb", (gltf) => {
        const model = gltf.scene;
        
        // 1. USE NATIVE BLENDER SCALE (1:1)
        // Since you applied transforms in Blender, we use 1,1,1.
        model.scale.set(1, 1, 1); 
        
        // 2. COORDINATE CONVERSION
        // Blender Z-up to Three.js Y-up
        model.rotation.set(Math.PI / 2, 0, 0); 
        
        model.position.set(0, 0, 0);
        anchor.group.add(model);
      });

      try {
        await mindarInstance.start();
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });
      } catch (err) {
        console.error("AR Start failed:", err);
      }
    };

    startAR();

    return () => {
      if (mindarInstance) {
        mindarInstance.stop();
        const video = document.querySelector("video");
        video?.remove();
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />
  );
}