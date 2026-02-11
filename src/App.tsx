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

      // 2. Initialize Engine
      mindarInstance = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/target/targets.mind", 
        uiScanning: "yes", 
      });

      const { renderer, scene, camera } = mindarInstance;

      // FIX 1: TRANSPARENCY (The correct way)
      // MindAR initializes the renderer with alpha:true by default.
      // We just need to ensure the clear color is transparent.
      renderer.setClearColor(0x000000, 0); 

      // FIX 2: COLOR SPACE (Fixes the "outputEncoding" warning)
      // Modern Three.js uses outputColorSpace
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
        
        // FIX 3: ROTATION & SCALE
        // Rotate 90 degrees on X to convert Blender Z-up to Three.js Y-up
        model.rotation.set(Math.PI / 2, 0, 0); 
        model.scale.set(0.2, 0.2, 0.2); 
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
        // Force cleanup of the video element
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