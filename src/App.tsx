import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MINDAR_URL = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

// CONFIG: Your menu width in meters
const MENU_WIDTH_METERS = 0.2; 

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
        
        // --- CTO TUNING FOR S24 ---
        // 1. MinCF (Jitter Control): 
        // kept low to stop shaking.
        filterMinCF: 0.001, 

        // 2. Beta (Lag Control): 
        // INCREASED from 0.001 -> 10. 
        // This stops the "drifting/floating". It forces the model to snap 
        // to the paper instantly when you move the phone.
        filterBeta: 10,

        // 3. WARMUP
        // We wait longer (10 frames) to ensure the first lock is accurate.
        warmupTolerance: 10, 
        missTolerance: 5, 
      });

      const { renderer, scene, camera } = mindarInstance;

      renderer.setClearColor(0x000000, 0); 
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // LIGHTING: Make it bright so depth is visible
      const ambient = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xffffff, 2.5);
      sun.position.set(5, 10, 5);
      scene.add(sun);

      const anchor = mindarInstance.addAnchor(0);

      const loader = new GLTFLoader();
      loader.load("/model/cake.glb", (gltf) => {
        const model = gltf.scene;

        // --- POSITION & SCALE FIXES ---
        
        // ROTATION: Stand up
        model.rotation.set(Math.PI / 2, 0, 0); 

        // SCALE: 
        // Using the auto-calculation based on your menu width
        const scaleFactor = 1 / MENU_WIDTH_METERS;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor); 
        
        // POSITION FIX (The "Too Close" Fix):
        // We push the model slightly "down" into the paper (z = -0.1) 
        // or just ensure it is exactly at 0.
        // If it feels like it's floating ABOVE the paper, set Z to a small negative number.
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
        if (video) video.remove();
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <style>{`
        body, html, #root { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        video { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; z-index: -2 !important; }
        canvas { z-index: 1 !important; }
      `}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}