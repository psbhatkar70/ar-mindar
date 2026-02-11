import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mindar: any;

    const startAR = async () => {
      const { MindARThree } = await import(
        "https://unpkg.com/mind-ar@1.2.5/dist/mindar-image-three.prod.js"
      );

      if (!containerRef.current) return;

      mindar = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/target/targets.mind",
      });

      const { renderer, scene, camera } = mindar;

      scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

      const anchor = mindar.addAnchor(0);

      const loader = new GLTFLoader();
      loader.load("/model/cake.glb", (gltf) => {
        gltf.scene.scale.set(0.1, 0.1, 0.1);
        anchor.group.add(gltf.scene);
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

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}
