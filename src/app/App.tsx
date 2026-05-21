import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface Chunk {
  id: string;
  text: string;
  flagged?: boolean;
  reason?: string;
  highlightType?: 'positive' | 'warning' | 'neutral';
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

  categoryScores: {
    citations: number;
    transparency: number;
    sensationalism: number;
    emotionalLanguage: number;
    writingQuality: number;
  };

  summary: string;

  explanation?: {
    text: string;
    source: 'llm' | 'local';
    model?: string;
    error?: string;
  };

  chunks: Chunk[];

  references: Reference[];
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activeRefId, setActiveRefId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

const chunkRefs = useRef<Record<string, HTMLSpanElement | null>>({});
const analyzerRef = useRef<HTMLDivElement | null>(null);
const textareaRef = useRef<HTMLTextAreaElement | null>(null);

const scrollToAnalyzer = () => {
  analyzerRef.current?.scrollIntoView({
    behavior: 'smooth',
  });

  setTimeout(() => {
    textareaRef.current?.focus();
  }, 500);
};

  const handlePasteOrChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
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
          throw new Error(
            data?.error ||
              'Backend did not return a valid analysis response.'
          );
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

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to analyze text.'
        );
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
    setInputText('');
    setAnalysis(null);
    setActiveRefId(null);
    setError(null);
  };

  const handleReferenceClick = (refId: string) => {
    if (activeRefId === refId) {
      setActiveRefId(null);
    } else {
      setActiveRefId(refId);

      const ref = analysis?.references.find((r) => r.id === refId);

      if (ref && ref.chunkIds.length > 0) {
        const firstChunkId = ref.chunkIds[0];
        const element = chunkRefs.current[firstChunkId];

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  };

  const activeChunkIds =
    analysis?.references.find((r) => r.id === activeRefId)
      ?.chunkIds || [];

  return (
    <div
      className={`min-h-screen font-sans selection:bg-gray-200 py-12 px-6 sm:px-12 flex flex-col items-center transition-colors duration-500 ${
        darkMode
          ? 'bg-[#0F1115] text-white'
          : 'bg-[#FDFDFD] text-gray-900'
      }`}
    >
      <div
        className={`w-full transition-all duration-700 ease-in-out ${
          analysis ? 'max-w-6xl' : 'max-w-3xl mt-20'
        }`}
      >
        {/* Header */}
<header className="mb-12 flex justify-between items-center opacity-90 w-full sticky top-0 z-50 backdrop-blur-sm">

  <div className="flex items-center gap-2">
    <Shield className="w-5 h-5" />

    <h1 className="text-sm font-semibold tracking-widest uppercase">
      CredCheck
    </h1>
  </div>

  <div className="flex items-center gap-6 text-xs uppercase tracking-widest font-semibold">

<button
  onClick={() => {
    reset();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
  }}
  className="hover:opacity-60 transition-opacity"
>
  Analyze New
</button>

    <a
      href="https://github.com/MrOhFive/Credibilityscoringwebsite"
      target="_blank"
      className="hover:opacity-60 transition-opacity"
    >
      GitHub
    </a>

    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`px-4 py-2 rounded-full transition-colors ${
        darkMode
          ? 'bg-gray-800 hover:bg-gray-700 text-white'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
      }`}
    >
      {darkMode ? 'Light' : 'Dark'}
    </button>

  </div>
</header>

        {/* Main Content */}
        <main>
          {!analysis ? (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center text-center"
  >

    {/* Hero */}
    <div className="max-w-4xl mx-auto mb-20 mt-10">

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 mb-6 text-xs uppercase tracking-widest font-semibold opacity-80">
        AI-Assisted Credibility Analysis
      </div>

      <h1 className={`text-6xl sm:text-7xl font-black tracking-tight leading-none mb-6 ${
        darkMode ? 'text-white' : 'text-black'
      }`}>
        Analyze credibility instantly.
      </h1>

      <p className={`text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Detect sensationalized language, emotional framing,
        supporting evidence, and credibility indicators using
        AI-assisted analysis.
      </p>

      <button
        onClick={scrollToAnalyzer}
        className="px-8 py-4 rounded-2xl bg-black text-white text-sm uppercase tracking-widest font-semibold hover:scale-[1.02] transition-transform"
      >
        Try the Analyzer
      </button>

    </div>

    {/* Analyzer */}
    <div
      ref={analyzerRef}
      className={`w-full max-w-4xl rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-colors duration-500 ${
        darkMode
          ? 'bg-[#181A20] border-gray-800'
          : 'bg-white border-gray-100'
      }`}
    >

      <textarea
       ref={textareaRef}
        className={`w-full h-[350px] bg-transparent border-0 focus:ring-0 text-xl leading-relaxed font-light resize-none outline-none p-8 transition-colors duration-500 ${
          darkMode
            ? 'placeholder:text-gray-600 text-white'
            : 'placeholder:text-gray-300 text-gray-900'
        }`}
        placeholder="Paste article, essay, or online content here..."
        value={inputText}
        onChange={handlePasteOrChange}
        autoFocus
      />

      <div className={`flex justify-between items-center px-8 py-5 border-t ${
        darkMode
          ? 'border-gray-800'
          : 'border-gray-100'
      }`}>

        <div className="text-xs uppercase tracking-widest opacity-50 font-semibold">
          AI Credibility Detection
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm opacity-70">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing
          </div>
        )}

      </div>
    </div>

    {/* Features */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-6xl">

      <div className={`rounded-3xl p-8 border transition-colors duration-500 ${
        darkMode
          ? 'bg-[#181A20] border-gray-800'
          : 'bg-white border-gray-100'
      }`}>
        <div className="text-lg font-bold mb-3">
          Credibility Detection
        </div>

        <p className="text-sm opacity-70 leading-relaxed">
          Analyze supporting evidence, citations, and transparency indicators.
        </p>
      </div>

      <div className={`rounded-3xl p-8 border transition-colors duration-500 ${
        darkMode
          ? 'bg-[#181A20] border-gray-800'
          : 'bg-white border-gray-100'
      }`}>
        <div className="text-lg font-bold mb-3">
          Sensationalism Analysis
        </div>

        <p className="text-sm opacity-70 leading-relaxed">
          Detect emotional framing, clickbait wording, and manipulative language.
        </p>
      </div>

      <div className={`rounded-3xl p-8 border transition-colors duration-500 ${
        darkMode
          ? 'bg-[#181A20] border-gray-800'
          : 'bg-white border-gray-100'
      }`}>
        <div className="text-lg font-bold mb-3">
          Explainable Scoring
        </div>

        <p className="text-sm opacity-70 leading-relaxed">
          Understand exactly why content gained or lost credibility points.
        </p>
      </div>

    </div>

  </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

              {/* Left Column */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`lg:col-span-7 xl:col-span-8 text-xl sm:text-2xl leading-relaxed font-light transition-colors duration-500 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-8 text-xs font-medium">

                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span>Sensationalized Language</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>Subjective Language</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span>Supporting Evidence</span>
                  </div>

                </div>

                {analysis.chunks.map((chunk) => {
                  const isActive = activeChunkIds.includes(chunk.id);

                  const isFaded =
                    activeRefId !== null && !isActive;

                  return (
                    <span
                      key={chunk.id}
                      ref={(el) =>
                        (chunkRefs.current[chunk.id] = el)
                      }
                      className={`transition-all duration-500 rounded-sm px-1 py-0.5 ${
                        isActive
                          ? 'bg-gray-900 text-white mx-0.5'
                          : chunk.highlightType === 'warning'
                          ? darkMode
                            ? 'bg-rose-900/40 text-rose-200'
                            : 'bg-rose-100 text-rose-800'
                          : chunk.highlightType === 'neutral'
                          ? darkMode
                            ? 'bg-amber-900/30 text-amber-200'
                            : 'bg-amber-100 text-amber-800'
                          : chunk.highlightType === 'positive'
                          ? darkMode
                            ? 'bg-emerald-900/30 text-emerald-200'
                            : 'bg-emerald-100 text-emerald-800'
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

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-5 xl:col-span-4 sticky top-12"
              >
                <div
                  className={`shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 transition-colors duration-500 ${
                    darkMode
                      ? 'bg-[#181A20] border border-gray-800'
                      : 'bg-white border border-gray-100'
                  }`}
                >

                  {/* Overall Score */}
                  <div className="mb-8">

                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Overall Score
                    </div>

                    <div className="flex items-baseline gap-2">

                      <div>
                        <span
                          className={`text-6xl font-black tracking-tighter ${
                            analysis.overallScore >= 80
                              ? 'text-emerald-600'
                              : analysis.overallScore >= 50
                              ? 'text-amber-500'
                              : 'text-rose-600'
                          }`}
                        >
                          {analysis.overallScore}
                        </span>

                        <div
                          className={`text-sm font-semibold uppercase tracking-wider mt-2 ${
                            analysis.overallScore >= 80
                              ? 'text-emerald-500'
                              : analysis.overallScore >= 50
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {analysis.overallScore >= 85
                            ? 'Highly Credible'
                            : analysis.overallScore >= 70
                            ? 'Mostly Credible'
                            : analysis.overallScore >= 50
                            ? 'Mixed Credibility'
                            : analysis.overallScore >= 30
                            ? 'Low Credibility'
                            : 'Highly Questionable'}
                        </div>
                      </div>

                      <span className="text-2xl font-medium text-gray-300">
                        / 100
                      </span>

                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-10">
                    <p
                      className={`text-sm leading-relaxed ${
                        darkMode
                          ? 'text-gray-300'
                          : 'text-gray-600'
                      }`}
                    >
                      {analysis.summary}
                    </p>
                  </div>

                  {analysis.explanation && (
                    <div
                      className={`mb-10 rounded-2xl border p-4 ${
                        darkMode
                          ? 'bg-[#23262F] border-gray-700'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles
                          className={`w-4 h-4 ${
                            analysis.explanation.source === 'llm'
                              ? 'text-emerald-500'
                              : 'text-amber-500'
                          }`}
                        />

                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                          Response Explanation
                        </div>
                      </div>

                      <p
                        className={`text-sm leading-relaxed ${
                          darkMode
                            ? 'text-gray-300'
                            : 'text-gray-600'
                        }`}
                      >
                        {analysis.explanation.text}
                      </p>

                      {analysis.explanation.source === 'local' && (
                        <p className="mt-3 text-xs leading-relaxed text-amber-500">
                          {analysis.explanation.error ||
                            'Set OPENAI_API_KEY to generate this explanation with an LLM.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Category Breakdown */}
                  <div className="mb-10">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                      Category Breakdown
                    </div>

                    <div className="space-y-4">
                      {Object.entries(
                        analysis.categoryScores
                      ).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1">
                            <span
                              className={`text-sm font-medium capitalize ${
                                darkMode
                                  ? 'text-gray-200'
                                  : 'text-gray-700'
                              }`}
                            >
                              {key.replace(
                                /([A-Z])/g,
                                ' $1'
                              )}
                            </span>

                            <span className="text-xs font-semibold text-gray-500">
                              {value}/10
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-700 ${
                                value >= 8
                                  ? 'bg-emerald-500'
                                  : value >= 5
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{
                                width: `${value * 10}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* References */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                      Specific Points
                    </div>

                    <div className="space-y-3">
                      {analysis.references.map((ref) => {
                        const isActive =
                          activeRefId === ref.id;

                        return (
                          <div
                            key={ref.id}
                            onClick={() =>
                              handleReferenceClick(ref.id)
                            }
                            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                              isActive
                                ? 'bg-gray-900 border-gray-900 text-white shadow-lg'
                                : darkMode
                                ? 'bg-[#23262F] border-gray-700 hover:bg-[#2A2E38] text-white'
                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">

                              <div
                                className={`mt-0.5 flex-shrink-0 ${
                                  isActive
                                    ? 'text-white'
                                    : getIconColor(ref.type)
                                }`}
                              >
                                {getIcon(ref.type)}
                              </div>

                              <div>
                                <h3
                                  className={`font-semibold text-sm mb-1 ${
                                    isActive
                                      ? 'text-white'
                                      : darkMode
                                      ? 'text-gray-100'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {ref.title}
                                </h3>

                                <p
                                  className={`text-xs leading-relaxed ${
                                    isActive
                                      ? 'text-gray-300'
                                      : darkMode
                                      ? 'text-gray-400'
                                      : 'text-gray-500'
                                  }`}
                                >
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
    case 'positive':
      return <CheckCircle2 className="w-4 h-4" />;

    case 'warning':
      return <AlertTriangle className="w-4 h-4" />;

    default:
      return <Info className="w-4 h-4" />;
  }
}

function getIconColor(type: string) {
  switch (type) {
    case 'positive':
      return 'text-emerald-500';

    case 'warning':
      return 'text-amber-500';

    default:
      return 'text-blue-500';
  }
}
