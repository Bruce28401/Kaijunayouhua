
export const SCROLL_SHAFT_RADIUS = 0.45;
export const SCROLL_SHAFT_HEIGHT = 8.5;
export const PAPER_HEIGHT = 8.2;
export const WORLD_WIDTH = 20; 
export const SHAFT_COLOR = 0xf1a30d; // 金黄锦缎色
export const CAP_COLOR = 0x0a0a0a;   // 黑檀色
export const BG_COLOR = 0xd9d6c3;
export const PAPER_COLOR = 0xfcfaf2; // 宣纸色
export const LERP_FACTOR = 0.15; 
export const ROTATION_SPEED_SCALE = 1.0 / SCROLL_SHAFT_RADIUS;

// 画卷内容纹理
export const PAPER_TEXTURE_URL = "https://images.unsplash.com/photo-1601564267675-0377e2501d4b?auto=format&fit=crop&q=80&w=1200&h=600";

// 背景红木纹理 - 使用更接近深色垂直木纹的图片
export const BG_TEXTURE_URL = "https://images.unsplash.com/photo-1622394096607-3a869f069818?q=80&w=1974&auto=format&fit=crop";

// 随机绘画风格
export const PAINTING_STYLES = [
  "水墨山水 (Ink Wash Landscape)",
  "青绿山水 (Blue-Green Landscape)",
  "工笔花鸟 (Meticulous Flower and Bird)",
  "写意山水 (Freehand Brushwork Landscape)",
  "禅意水墨 (Zen Ink Art)"
];

// 闭合阈值：轴杆半径为0.45，两轴接触时中心距为0.9
export const CLOSED_THRESHOLD = 0.95; 
export const GENERATION_TIME = 5000;
