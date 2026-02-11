import { useEffect, useRef } from "react";
import './App.css';
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// CTO Note: Use production build for stability on S24
const MINDAR_URL = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mindarInstance: any;

    const startAR = async () => {
      // 1. Dynamic Import
      const { MindARThree } = await import(/* @vite-ignore */ MINDAR_URL);

      if (!containerRef.current) return;

      // 2. Initialize Engine
      mindarInstance = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/target/targets.mind", 
        uiScanning: "yes", 
      });

      const { renderer, scene, camera } = mindarInstance;

      // FIX 1: TRANSPARENCY
      // This makes the 3D canvas transparent so the camera video shows through
      renderer.setAlpha(true);
      renderer.setClearColor(0x000000, 0); 

      // 3. Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 1);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xffffff, 2);
      sun.position.set(5, 10, 5); // Sun coming from top-right
      scene.add(sun);

      // 4. Anchor
      const anchor = mindarInstance.addAnchor(0);

      // 5. Model Loading
      const loader = new GLTFLoader();
      loader.load("/model/cake.glb", (gltf) => {
        const model = gltf.scene;
        
        // FIX 2: ROTATION (The Brown Line Fix)
        // Rotate 90 degrees on X to convert Blender Z-up to Three.js Y-up
        model.rotation.set(Math.PI / 2, 0, 0); 
        
        // SCALE: 
        // In MindAR, 1 unit = width of the physical image target.
        // If your model is real-scale (0.2m), try 0.2 first.
        model.scale.set(0.2, 0.2, 0.2); 
        
        // Center it perfectly
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
        video?.remove();
      }
    };
  }, []);

  return (
    // FIX 3: REMOVE BACKGROUND COLOR
    <div
      ref={containerRef}
      style={{ 
        width: "100vw", 
        height: "100vh", 
        overflow: "hidden",
        position: "relative" // Crucial for video layering
      }}
    />
  );
}