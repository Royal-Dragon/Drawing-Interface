
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const colors = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ffffff"];

type Layer = {
  id: string;
  name: string;
  visible: boolean;
  canvas: HTMLCanvasElement;
};

type Tool = 'brush' | 'rectangle' | 'circle' | 'eraser';

export default function DrawingApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [selectedTool, setSelectedTool] = useState<Tool>('brush');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayer, setActiveLayer] = useState<string>('');
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth * 0.9;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctxRef.current = ctx;
      }
    }
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.lineWidth = brushSize;
    }
  }, [brushSize]);

  const startDrawing = ({ nativeEvent }: any) => {
    const { offsetX, offsetY } = nativeEvent;
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      if (selectedTool === 'brush' || selectedTool === 'eraser') {
        ctxRef.current.moveTo(offsetX, offsetY);
      } else {
        setStartPos({ x: offsetX, y: offsetY });
      }
      if (selectedTool === 'eraser') {
        ctxRef.current.globalCompositeOperation = 'destination-out';
      } else {
        ctxRef.current.globalCompositeOperation = 'source-over';
      }
    }
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: any) => {
    if (!isDrawing || !ctxRef.current || !canvasRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    
    if (selectedTool === 'brush' || selectedTool === 'eraser') {
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();
    } else if (startPos) {
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (history.length > 0 && historyStep > 0) {
        ctx.putImageData(history[historyStep - 1], 0, 0);
      }
      
      ctx.beginPath();
      if (selectedTool === 'rectangle') {
        const width = offsetX - startPos.x;
        const height = offsetY - startPos.y;
        ctx.rect(startPos.x, startPos.y, width, height);
      } else if (selectedTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(offsetX - startPos.x, 2) + Math.pow(offsetY - startPos.y, 2)
        );
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    }
  };

  const endDrawing = () => {
    if (!ctxRef.current || !canvasRef.current) return;
    ctxRef.current.closePath();
    setIsDrawing(false);
    const snapshot = ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const newHistory = history.slice(0, historyStep);
    setHistory([...newHistory, snapshot]);
    setHistoryStep(prev => prev + 1);
  };

  const undo = () => {
    if (historyStep > 0 && canvasRef.current && ctxRef.current) {
      const step = historyStep - 1;
      ctxRef.current.putImageData(history[step], 0, 0);
      setHistoryStep(step);
    }
  };

  const redo = () => {
    if (historyStep < history.length && canvasRef.current && ctxRef.current) {
      ctxRef.current.putImageData(history[historyStep], 0, 0);
      setHistoryStep(historyStep + 1);
    }
  };

  const clearCanvas = () => {
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveAsImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-4 text-center"
      >
        🎨 Drawing Interface
      </motion.h1>
      <div className="flex flex-col md:flex-row justify-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-lg shadow">
          <span className="text-sm font-medium">Tools:</span>
          <button
            onClick={() => setSelectedTool('brush')}
            className={`p-2 rounded ${selectedTool === 'brush' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            🖌️ Brush
          </button>
          <button
            onClick={() => setSelectedTool('rectangle')}
            className={`p-2 rounded ${selectedTool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            ⬜ Rectangle
          </button>
          <button
            onClick={() => setSelectedTool('circle')}
            className={`p-2 rounded ${selectedTool === 'circle' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            ⭕ Circle
          </button>
          <button
            onClick={() => setSelectedTool('eraser')}
            className={`p-2 rounded ${selectedTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            ❌ Eraser
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-lg shadow">
          <span className="text-sm font-medium">Colors:</span>
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow">
          <span className="text-sm font-medium">Size:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm">{brushSize}px</span>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        <button onClick={undo} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow transition-colors">
          ↩️ Undo
        </button>
        <button onClick={redo} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow transition-colors">
          ↪️ Redo
        </button>
        <button onClick={clearCanvas} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition-colors">
          🗑️ Clear
        </button>
        <button onClick={saveAsImage} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors">
          💾 Save
        </button>
      </div>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className="border border-gray-400 bg-white rounded shadow-lg"
        />
      </div>
      <footer className="text-center text-sm text-gray-500 mt-6">© 2025 Drawing App. All rights reserved.</footer>
    </div>
  );
}
