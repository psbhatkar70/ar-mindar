import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// CTO Note: Use the production build URL for stability
const MINDAR_URL = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mindarInstance: any;

    const startAR = async () => {
      // 1. Dynamic Import
      const { MindARThree } = await import(/* @vite-ignore */ MINDAR_URL);

      if (!containerRef.current) return;

      // 2. Fix Paths: Root slash '/' points to your public folder automatically
      mindarInstance = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/target/targets.mind", 
        uiScanning: "yes", // Set to "no" if you want a custom UI later
      });

      const { renderer, scene, camera } = mindarInstance;

      // 3. Lighting (Added Ambient + Directional for better food look)
      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xffffff, 1);
      sun.position.set(1, 1, 1);
      scene.add(sun);

      // 4. Anchor
      const anchor = mindarInstance.addAnchor(0);

      // 5. Model Loading (Fixed Path)
      const loader = new GLTFLoader();
      loader.load("/model/cake.glb", (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.1, 0.1, 0.1);
        anchor.group.add(model);
      });

      // 6. Start Engine
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
        // Clean up video feed to release the S24 camera
        const video = document.querySelector("video");
        video?.remove();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", background: "#000", position: 'relative' }}
    />
  );
}