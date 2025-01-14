import { useEffect, useRef } from 'react';
import { PixiApp } from './pixi/app';

export default function App() {
  const pixiAppRef = useRef<PixiApp | null>(null);

  useEffect(() => {
    // Initialize Pixi.js app
    const app = new PixiApp();
    app.init();
    pixiAppRef.current = app;

    // Cleanup on unmount
    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.cleanup();
      }
    };
  }, []);

  return (
    <main className="w-screen h-screen bg-black">
      {/* Pixi.js will automatically append canvas to body */}
    </main>
  );
} 