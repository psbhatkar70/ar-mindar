import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// CTO Note: Using the production build for stability
const MINDAR_URL = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mindarInstance: any;

    const startAR = async () => {
      // 1. Dynamic Import
      // @ts-ignore
      const { MindARThree } = await import(/* @vite-ignore */ MINDAR_URL);

      if (!containerRef.current) return;

      // 2. Initialize Engine with STABILITY FILTERS
      mindarInstance = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/target/targets.mind", 
        uiScanning: "yes", 
        
        // TWEAK 1: ANTI-SHAKE FILTERS
        // These settings smooth out the "jitter" (shaking)
        filterMinCF: 0.0001, // Lower = smoother tracking (less shaking)
        filterBeta: 0.001,   // Lower = less lag
        
        // TWEAK 2: FLICKER PREVENTION
        // If camera loses the menu for 5 frames, don't hide the model immediately
        missTolerance: 5,   
        warmupTolerance: 5, 
      });

      const { renderer, scene, camera } = mindarInstance;

      // Transparency & Color Correction
      renderer.setClearColor(0x000000, 0); 
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // 3. Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 1);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(5, 10, 5); 
      scene.add(sun);

      // 4. Anchor
      const anchor = mindarInstance.addAnchor(0);

      // 5. Model Loading
      const loader = new GLTFLoader();
      loader.load("/model/cake.glb", (gltf) => {
        const model = gltf.scene;
        
        // ROTATION (Kept exactly as you said it was perfect)
        model.rotation.set(Math.PI / 2, 0, 0); 
        
        // TWEAK 3: SCALE UP
        // Increased from 0.2 to 0.5. 
        // If still too small, try 0.8. If too big, try 0.3.
        model.scale.set(0.5, 0.5, 0.5); 
        
        model.position.set(0, 0, 0);
        
        anchor.group.add(model);
      });

      // 6. Start
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
        if (video) {
          video.srcObject = null;
          video.remove();
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ 
        width: "100vw", 
        height: "100vh", 
        overflow: "hidden",
        position: "relative"
      }}
    />
  );
}