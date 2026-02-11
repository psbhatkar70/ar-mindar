import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mindar = new MindARThree({
      container: containerRef.current,
      imageTargetSrc: "/target/targets.mind",
    });

    const { renderer, scene, camera } = mindar;

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const anchor = mindar.addAnchor(0);

    const loader = new GLTFLoader();
    loader.load("/model/cake.glb", (gltf) => {
      gltf.scene.scale.set(0.1, 0.1, 0.1);
      anchor.group.add(gltf.scene);
    });

    mindar.start();

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    return () => {
      mindar.stop();
      renderer.setAnimationLoop(null);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", background: "black" }}
    />
  );
}
