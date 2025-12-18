
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HandData } from '../types';
import { 
  SCROLL_SHAFT_RADIUS, 
  SCROLL_SHAFT_HEIGHT, 
  PAPER_HEIGHT, 
  WORLD_WIDTH, 
  SHAFT_COLOR, 
  CAP_COLOR,
  BG_COLOR,
  BG_TEXTURE_URL,
  LERP_FACTOR, 
  ROTATION_SPEED_SCALE,
  PAPER_TEXTURE_URL,
  CLOSED_THRESHOLD
} from '../constants';

interface ThreeSceneProps {
  handData: HandData;
  isGenerating: boolean;
  currentTextureUrl: string;
  onScrollStateChange: (isClosed: boolean) => void;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ handData, isGenerating, currentTextureUrl, onScrollStateChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    shaftLeft: THREE.Group;
    shaftRight: THREE.Group;
    paper: THREE.Group;
    paperMaterial: THREE.MeshStandardMaterial;
    prevLeftX: number;
    prevRightX: number;
    textureLoader: THREE.TextureLoader;
  } | null>(null);

  const targets = useRef({
    leftX: -SCROLL_SHAFT_RADIUS,
    rightX: SCROLL_SHAFT_RADIUS
  });

  // 处理贴图更新
  useEffect(() => {
    if (sceneRef.current && currentTextureUrl) {
      sceneRef.current.textureLoader.load(currentTextureUrl, (texture) => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        sceneRef.current!.paperMaterial.map = texture;
        sceneRef.current!.paperMaterial.needsUpdate = true;
      });
    }
  }, [currentTextureUrl]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();

    // 加载并设置背景纹理
    textureLoader.load(BG_TEXTURE_URL, (bgTex) => {
      bgTex.wrapS = THREE.RepeatWrapping;
      bgTex.wrapT = THREE.RepeatWrapping;
      // 调整重复率以匹配提供的木纹密度，模拟垂直红木纹理
      bgTex.repeat.set(1.5, 1);
      scene.background = bgTex;
    }, undefined, () => {
      scene.background = new THREE.Color(BG_COLOR);
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5e6, 0.6);
    mainLight.position.set(5, 10, 10);
    scene.add(mainLight);

    const paperTexture = textureLoader.load(currentTextureUrl || PAPER_TEXTURE_URL);
    paperTexture.wrapS = THREE.ClampToEdgeWrapping;
    paperTexture.wrapT = THREE.ClampToEdgeWrapping;

    const createShaft = () => {
      const group = new THREE.Group();
      const pivot = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(SCROLL_SHAFT_RADIUS, SCROLL_SHAFT_RADIUS, SCROLL_SHAFT_HEIGHT, 32);
      const bodyMat = new THREE.MeshStandardMaterial({ color: SHAFT_COLOR, roughness: 0.3, metalness: 0.1 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      pivot.add(body);
      group.add(pivot);

      const capGeo = new THREE.SphereGeometry(SCROLL_SHAFT_RADIUS * 1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: CAP_COLOR, roughness: 0.1, metalness: 0.2 });
      const topCap = new THREE.Mesh(capGeo, capMat);
      topCap.position.y = SCROLL_SHAFT_HEIGHT / 2;
      const bottomCap = new THREE.Mesh(capGeo, capMat);
      bottomCap.position.y = -SCROLL_SHAFT_HEIGHT / 2;
      bottomCap.rotation.x = Math.PI;
      group.add(topCap, bottomCap);
      return group;
    };

    const shaftLeft = createShaft();
    const shaftRight = createShaft();
    
    // 初始位置设为闭合点
    shaftLeft.position.x = -SCROLL_SHAFT_RADIUS;
    shaftRight.position.x = SCROLL_SHAFT_RADIUS;
    
    scene.add(shaftLeft, shaftRight);

    const paperGroup = new THREE.Group();
    const paperMat = new THREE.MeshStandardMaterial({ 
      map: paperTexture, 
      side: THREE.DoubleSide, 
      roughness: 1.0, 
      metalness: 0.0 
    });
    const paperMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, PAPER_HEIGHT), paperMat);
    paperMesh.position.z = 0.01;
    
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xda9100 });
    const border = new THREE.Mesh(new THREE.PlaneGeometry(1.05, PAPER_HEIGHT + 0.3), borderMat);
    border.position.z = -0.01;
    
    paperGroup.add(paperMesh, border);
    scene.add(paperGroup);

    sceneRef.current = {
      scene, camera, renderer, shaftLeft, shaftRight, 
      paper: paperGroup, paperMaterial: paperMat,
      prevLeftX: -SCROLL_SHAFT_RADIUS, 
      prevRightX: SCROLL_SHAFT_RADIUS, 
      textureLoader
    };

    let frameId: number;
    let wasClosed = false;

    const animate = () => {
      if (!sceneRef.current) return;
      const { shaftLeft, shaftRight, paper, paperMaterial, renderer, scene, camera } = sceneRef.current;

      shaftLeft.position.x += (targets.current.leftX - shaftLeft.position.x) * LERP_FACTOR;
      shaftRight.position.x += (targets.current.rightX - shaftRight.position.x) * LERP_FACTOR;

      const dxL = shaftLeft.position.x - sceneRef.current.prevLeftX;
      const dxR = shaftRight.position.x - sceneRef.current.prevRightX;
      shaftLeft.children[0].rotation.y -= dxL * ROTATION_SPEED_SCALE;
      shaftRight.children[0].rotation.y += dxR * ROTATION_SPEED_SCALE;

      sceneRef.current.prevLeftX = shaftLeft.position.x;
      sceneRef.current.prevRightX = shaftRight.position.x;

      const width = Math.max(0.01, shaftRight.position.x - shaftLeft.position.x);
      
      // 闭合检测：当间距接近或等于 2 * 半径时视为闭合
      const isCurrentlyClosed = width < CLOSED_THRESHOLD;
      if (isCurrentlyClosed !== wasClosed) {
        onScrollStateChange(isCurrentlyClosed);
        wasClosed = isCurrentlyClosed;
      }

      paper.scale.x = width;
      paper.position.x = (shaftLeft.position.x + shaftRight.position.x) / 2;

      if (paperMaterial.map) {
        const totalRange = WORLD_WIDTH; 
        const leftLimit = -totalRange / 2; 
        paperMaterial.map.offset.x = (shaftLeft.position.x - leftLimit) / totalRange;
        paperMaterial.map.repeat.x = width / totalRange;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (isGenerating) {
      targets.current.leftX = -SCROLL_SHAFT_RADIUS;
      targets.current.rightX = SCROLL_SHAFT_RADIUS;
      return;
    }

    const range = WORLD_WIDTH / 2;
    // 左轴限制在 X <= -SCROLL_SHAFT_RADIUS，右轴限制在 X >= SCROLL_SHAFT_RADIUS
    // 这样当两轴靠近时，它们会刚好在中线(X=0)处接触，边缘不会互相重叠
    if (handData.left) {
      targets.current.leftX = Math.min(-SCROLL_SHAFT_RADIUS, (handData.left.x * WORLD_WIDTH) - range);
    }
    if (handData.right) {
      targets.current.rightX = Math.max(SCROLL_SHAFT_RADIUS, (handData.right.x * WORLD_WIDTH) - range);
    }
  }, [handData, isGenerating]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ThreeScene;
