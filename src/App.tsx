import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mindar: any;

    const startAR = async () => {
      // MindAR via CDN (ESM)
      const { MindARThree } = await import(
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.module.js"
);


      if (!containerRef.current) return;

      mindar = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "../public/target/targets.mind",
      });

      const { renderer, scene, camera } = mindar;

      // light
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      // anchor
      const anchor = mindar.addAnchor(0);

      // model
      const loader = new GLTFLoader();
      loader.load("../public/model/cake.glb", (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.1, 0.1, 0.1);
        anchor.group.add(model);
      });

      await mindar.start();

      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    };

    startAR();

    return () => {
      mindar?.stop();
      document.querySelector("video")?.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", background: "#000" }}
    />
  );
}
