
import React, { useEffect, useRef, useCallback } from 'react';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
}

declare const Hands: any;
declare const Camera: any;

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: any) => {
      let left = null;
      let right = null;

      if (results.multiHandLandmarks && results.multiHandedness) {
        results.multiHandedness.forEach((handedness: any, index: number) => {
          const landmarks = results.multiHandLandmarks[index];
          // 使用食指指根（节点5）作为稳定的追踪点
          // 这里的 1 - x 是为了匹配镜像显示的画面坐标
          const pos = { x: 1 - landmarks[5].x, y: landmarks[5].y }; 
          
          /**
           * 修复关联关系：
           * 在镜像模式下，MediaPipe 返回的 "Left" 标签实际上对应画面左侧的手（即用户的物理右手）。
           * 因此，为了让物理左手控制 left 变量（对应 3D 场景左轴），
           * 我们需要将 MediaPipe 的 "Right" 标签映射到 left，将 "Left" 映射到 right。
           */
          if (handedness.label === 'Right') {
            left = pos;
          } else {
            right = pos;
          }
        });
      }

      onHandUpdate({ left, right });
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [onHandUpdate]);

  return (
    <div className="fixed bottom-4 right-4 w-48 h-36 rounded-xl border-4 border-amber-800 overflow-hidden shadow-2xl bg-black/50 z-50">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute top-1 left-2 text-[10px] bg-black/40 px-1 rounded text-amber-200 uppercase tracking-tighter">
        Hand Tracking Active
      </div>
    </div>
  );
};

export default HandTracker;
