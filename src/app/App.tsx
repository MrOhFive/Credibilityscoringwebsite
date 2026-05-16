import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Info } from 'lucide-react';

interface Chunk {
  id: string;
  text: string;
  score: number;
  explanation: string;
}

const generateAnalysis = (text: string): Chunk[] => {
  // Split by sentence endings, keeping the punctuation attached to the sentence
  const sentenceRegex = /[^.!?]+[.!?]+[\])'"`’”]*\s*|.+/g;
  const matches = text.match(sentenceRegex);
  
  if (!matches) return [];

  const explanations = [
    "Supported by multiple peer-reviewed studies.",
    "Contains subjective language and lacks citations.",
    "Broadly accepted as factual in reputable sources.",
    "Potential exaggeration; verify with primary sources.",
    "Statistical claim without clear methodology provided.",
    "Aligns with consensus among domain experts.",
    "Anecdotal evidence; cannot be broadly applied."
  ];

  return matches.map((sentence, i) => {
    let hash = 0;
    for (let j = 0; j < sentence.length; j++) {
      hash = sentence.charCodeAt(j) + ((hash << 5) - hash);
    }
    const score = Math.abs(hash % 10) + 1; // 1 to 10
    const explIndex = Math.abs(hash % explanations.length);
    
    return {
      id: `chunk-${i}`,
      text: sentence,
      score,
      explanation: explanations[explIndex]
    };
  });
};

export default function App() {
  const [inputText, setInputText] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Use a ref to track if we should update position (only if not pinned)
  const isPinnedRef = useRef(false);
  isPinnedRef.current = pinnedId !== null;

  const handlePasteOrChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim().length > 0) {
      setChunks(generateAnalysis(e.target.value));
    }
  };

  const activeId = pinnedId || hoveredId;
  const activeChunk = chunks.find(c => c.id === activeId);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPinnedRef.current) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleChunkClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedId === id) {
      // Unpin
      setPinnedId(null);
    } else {
      // Pin new
      setPinnedId(id);
      setHoveredId(null);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleDocumentClick = () => {
    if (pinnedId) {
      setPinnedId(null);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [pinnedId]);

  const reset = () => {
    setInputText("");
    setChunks([]);
    setPinnedId(null);
    setHoveredId(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (score >= 5) return "text-amber-500 bg-amber-50 border-amber-200";
    return "text-rose-500 bg-rose-50 border-rose-200";
  };

  const getHighlightColor = (score: number) => {
    if (score >= 8) return "bg-emerald-100/80 text-emerald-950";
    if (score >= 5) return "bg-amber-100/80 text-amber-950";
    return "bg-rose-100/80 text-rose-950";
  };

  return (
    <div 
      className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-gray-200 flex flex-col items-center py-20 px-6 sm:px-12 relative"
      onMouseMove={handleMouseMove}
    >
      <div className="max-w-3xl w-full">
        <header className="mb-12 flex justify-between items-center opacity-80">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <h1 className="text-sm font-medium tracking-widest uppercase">CredCheck</h1>
          </div>
          {chunks.length > 0 && (
            <button 
              onClick={reset}
              className="text-xs font-medium uppercase tracking-wider flex items-center gap-2 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
        </header>

        <main className="w-full">
          {chunks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <textarea
                className="w-full h-[50vh] bg-transparent border-0 focus:ring-0 text-2xl sm:text-3xl leading-relaxed resize-none placeholder:text-gray-300"
                placeholder="Paste your text here to analyze its credibility..."
                value={inputText}
                onChange={handlePasteOrChange}
                autoFocus
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl sm:text-3xl leading-relaxed font-light text-gray-400"
            >
              {chunks.map((chunk) => {
                const isHovered = hoveredId === chunk.id;
                const isPinned = pinnedId === chunk.id;
                const isActive = isHovered || isPinned;
                
                return (
                  <span
                    key={chunk.id}
                    className={`transition-all duration-300 cursor-pointer rounded-sm mix-blend-multiply ${
                      isActive ? getHighlightColor(chunk.score) : 'text-gray-800 hover:text-gray-600'
                    } ${isPinned ? 'ring-2 ring-black/5 ring-offset-2' : ''}`}
                    onMouseEnter={() => {
                      if (!pinnedId) setHoveredId(chunk.id);
                    }}
                    onMouseLeave={() => {
                      if (!pinnedId && hoveredId === chunk.id) setHoveredId(null);
                    }}
                    onClick={(e) => handleChunkClick(chunk.id, e)}
                  >
                    {chunk.text}
                  </span>
                );
              })}
            </motion.div>
          )}
        </main>
      </div>

      {/* Tooltip Overlay */}
      <AnimatePresence>
        {activeChunk && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`fixed z-50 w-72 p-5 rounded-2xl shadow-xl border backdrop-blur-md ${getScoreColor(activeChunk.score)}`}
            style={{
              left: tooltipPos.x + 15,
              top: tooltipPos.y + 15,
              transform: `translate(
                ${typeof window !== 'undefined' && tooltipPos.x > window.innerWidth - 320 ? 'calc(-100% - 30px)' : '0'},
                ${typeof window !== 'undefined' && tooltipPos.y > window.innerHeight - 200 ? 'calc(-100% - 30px)' : '0'}
              )`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {activeChunk.score >= 8 ? <ShieldCheck className="w-5 h-5" /> : 
                 activeChunk.score >= 5 ? <Info className="w-5 h-5" /> : 
                 <ShieldAlert className="w-5 h-5" />}
                <span className="font-bold text-sm uppercase tracking-wider">Credibility</span>
              </div>
              <div className="text-3xl font-black">
                {activeChunk.score}<span className="text-sm font-medium opacity-50">/10</span>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed font-medium opacity-90">
              {activeChunk.explanation}
            </p>

            {pinnedId && (
              <div className="mt-4 pt-3 border-t border-current/10 text-xs font-semibold uppercase tracking-widest opacity-60">
                Pinned • Click elsewhere to close
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
