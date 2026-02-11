import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MINDAR_URL = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

// --- ARCHITECTURAL CONFIGURATION ---
// Measure your physical printed menu width in meters.
// Standard A4 paper width is approx 0.21 meters.
// If you are testing on a laptop screen, it's likely around 0.3 meters.
const MENU_WIDTH_METERS = 0.2; // Set this to the REAL width of your target

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

  // --- THE "MAGIC" VALUES FROM GITHUB ISSUE #146 ---
  // Many users confirmed these specific numbers killed the jitter:
  filterMinCF: 0.0001, // Very aggressive smoothing
  filterBeta: 0.001,   // Minimizes lag while smoothing

  // OPTIONAL: Keep these to prevent flickering if tracking is lost briefly
  missTolerance: 5,
  warmupTolerance: 5,
});

      const { renderer, scene, camera } = mindarInstance;

      renderer.setClearColor(0x000000, 0); 
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const ambient = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xffffff, 2.0);
      sun.position.set(5, 10, 5);
      scene.add(sun);

      const anchor = mindarInstance.addAnchor(0);

      const loader = new GLTFLoader();
      loader.load("/model/cake.glb", (gltf) => {
        const model = gltf.scene;

        // --- AUTOMATIC SCALING LOGIC ---
        
        // 1. ROTATION: Fix Blender Z-up to Three.js Y-up
        model.rotation.set(Math.PI / 2, 0, 0); 

        // 2. NORMALIZATION: 
        // Calculate the scale factor needed to make 1 Unit = 1 Meter
        const scaleFactor = 1 / MENU_WIDTH_METERS;
        
        // Apply the scale uniformly. 
        // Now, a 0.2m model in Blender will visually appear as 0.2m in AR.
        model.scale.set(scaleFactor, scaleFactor, scaleFactor); 
        
        model.position.set(0, 0, 0);

        anchor.group.add(model);
        
        // Debug Log: Verifies the calculation
        console.log(`Auto-Scaling Applied: ${scaleFactor}x (Based on ${MENU_WIDTH_METERS}m target width)`);
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