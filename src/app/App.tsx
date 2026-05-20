import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

interface Chunk {
  id: string;
  text: string;
}

interface Reference {
  id: string;
  chunkIds: string[];
  title: string;
  explanation: string;
  type: 'positive' | 'warning' | 'neutral';
}

interface Analysis {
  overallScore: number;
  summary: string;
  chunks: Chunk[];
  references: Reference[];
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activeRefId, setActiveRefId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chunkRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const handlePasteOrChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  useEffect(() => {
    const text = inputText.trim();

    if (!text) {
      setAnalysis(null);
      setError(null);
      setIsAnalyzing(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : null;

        if (!response.ok) {
          throw new Error(data?.error || 'Backend did not return a valid analysis response.');
        }

        if (!data) {
          throw new Error('Backend returned an empty response.');
        }

        setAnalysis(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        setAnalysis(null);
        setError(err instanceof Error ? err.message : 'Unable to analyze text.');
      } finally {
        if (!controller.signal.aborted) {
          setIsAnalyzing(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inputText]);

  const reset = () => {
    setInputText("");
    setAnalysis(null);
    setActiveRefId(null);
    setError(null);
  };

  const handleReferenceClick = (refId: string) => {
    if (activeRefId === refId) {
      setActiveRefId(null); // Toggle off
    } else {
      setActiveRefId(refId);
      
      // Scroll the first active chunk into view
      const ref = analysis?.references.find(r => r.id === refId);
      if (ref && ref.chunkIds.length > 0) {
        const firstChunkId = ref.chunkIds[0];
        const element = chunkRefs.current[firstChunkId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const activeChunkIds = analysis?.references.find(r => r.id === activeRefId)?.chunkIds || [];

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-gray-200 py-12 px-6 sm:px-12 flex flex-col items-center">
      <div className={`w-full transition-all duration-700 ease-in-out ${analysis ? 'max-w-6xl' : 'max-w-3xl mt-20'}`}>
        
        {/* Header */}
        <header className="mb-12 flex justify-between items-center opacity-80">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <h1 className="text-sm font-semibold tracking-widest uppercase">CredCheck</h1>
          </div>
          {analysis && (
            <button 
              onClick={reset}
              className="text-xs font-medium uppercase tracking-wider flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Analyze New
            </button>
          )}
        </header>

        {/* Main Content Area */}
        <main>
          {!analysis ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <textarea
                className="w-full h-[60vh] bg-transparent border-0 focus:ring-0 text-3xl sm:text-4xl leading-relaxed font-light resize-none placeholder:text-gray-300 outline-none"
                placeholder="Paste your text here to generate a credibility report..."
                value={inputText}
                onChange={handlePasteOrChange}
                autoFocus
              />
              {isAnalyzing && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing
                </div>
              )}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
              
              {/* Left Column: Text Content */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="lg:col-span-7 xl:col-span-8 text-xl sm:text-2xl leading-relaxed font-light text-gray-700"
              >
                {analysis.chunks.map((chunk) => {
                  const isActive = activeChunkIds.includes(chunk.id);
                  const isFaded = activeRefId !== null && !isActive;
                  
                  return (
                    <span
                      key={chunk.id}
                      ref={(el) => chunkRefs.current[chunk.id] = el}
                      className={`transition-all duration-500 rounded-sm ${
                        isActive 
                          ? 'bg-gray-900 text-white px-1 py-0.5 mx-0.5' 
                          : isFaded 
                            ? 'opacity-30' 
                            : ''
                      }`}
                    >
                      {chunk.text}
                    </span>
                  );
                })}
              </motion.div>

              {/* Right Column: Report Sidebar */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-5 xl:col-span-4 sticky top-12"
              >
                <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8">
                  {/* Overall Score */}
                  <div className="mb-8">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Overall Score</div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-black tracking-tighter ${
                        analysis.overallScore >= 8 ? 'text-emerald-600' :
                        analysis.overallScore >= 5 ? 'text-amber-500' : 'text-rose-600'
                      }`}>
                        {analysis.overallScore}
                      </span>
                      <span className="text-2xl font-medium text-gray-300">/ 10</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-10">
                    <p className="text-sm leading-relaxed text-gray-600">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* References List */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Specific Points</div>
                    <div className="space-y-3">
                      {analysis.references.map((ref) => {
                        const isActive = activeRefId === ref.id;
                        
                        return (
                          <div 
                            key={ref.id}
                            onClick={() => handleReferenceClick(ref.id)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                              isActive 
                                ? 'bg-gray-900 border-gray-900 text-white shadow-lg' 
                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : getIconColor(ref.type)}`}>
                                {getIcon(ref.type)}
                              </div>
                              <div>
                                <h3 className={`font-semibold text-sm mb-1 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                  {ref.title}
                                </h3>
                                <p className={`text-xs leading-relaxed ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {ref.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                </div>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Helpers
function getIcon(type: string) {
  switch (type) {
    case 'positive': return <CheckCircle2 className="w-4 h-4" />;
    case 'warning': return <AlertTriangle className="w-4 h-4" />;
    default: return <Info className="w-4 h-4" />;
  }
}

function getIconColor(type: string) {
  switch (type) {
    case 'positive': return 'text-emerald-500';
    case 'warning': return 'text-amber-500';
    default: return 'text-blue-500';
  }
}
