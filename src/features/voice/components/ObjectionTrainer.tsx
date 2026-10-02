import { useState, useRef, useEffect } from "react";
import { ICP } from "../../../types";
import {
  Swords,
  Mic,
  Play,
  Square,
  Star,
  MessageCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
  Shield,
  Zap,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { objectionTrainerTurn, type ObjectionTrainerResponse } from "../../../services/ai.service";

interface ObjectionTrainerProps {
  icp: ICP | null;
}

interface TrainingMessage {
  id: string;
  role: "ai_prospect" | "user_rep";
  text: string;
}

interface ScoreResult {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  rebuttalTip: string;
}

export function ObjectionTrainer({ icp }: ObjectionTrainerProps) {
  const [mode, setMode] = useState<"setup" | "sparring" | "review">("setup");
  const [messages, setMessages] = useState<TrainingMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [selectedObjection, setSelectedObjection] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<{
    req: Parameters<typeof objectionTrainerTurn>[0];
    onSuccess: (res: ObjectionTrainerResponse) => void;
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const icpObjections = icp?.objections || [
    "We already have a solution for that",
    "It's too expensive for our budget",
    "We need to think about it",
    "Send me an email instead",
    "We're not interested right now",
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const executeTurn = async (
    req: Parameters<typeof objectionTrainerTurn>[0],
    onSuccess: (res: ObjectionTrainerResponse) => void,
  ) => {
    pendingRef.current = { req, onSuccess };
    setIsLoading(true);
    setError(null);
    try {
      const result = await objectionTrainerTurn(req);
      onSuccess(result);
    } catch (err) {
      console.error("Objection trainer request failed:", err);
      setError(typeof err === "string" ? err : "The coach request failed. Nothing was generated.");
    } finally {
      setIsLoading(false);
    }
  };

  const retryPending = async () => {
    const pending = pendingRef.current;
    if (!pending || isLoading) return;
    await executeTurn(pending.req, pending.onSuccess);
  };

  const startSparring = async () => {
    if (!selectedObjection) return;
    setMode("sparring");
    setMessages([]);
    await executeTurn(
      {
        mode: "start",
        objection: selectedObjection,
        difficulty,
        messages: [],
        icp: icp || null,
      },
      (result) => {
        setMessages([
          {
            id: Date.now().toString(),
            role: "ai_prospect",
            text:
              result.text || `Look, I'll be honest with you — ${selectedObjection.toLowerCase()}.`,
          },
        ]);
      },
    );
  };

  const sendReply = async () => {
    if (!userInput.trim() || isLoading || error) return;
    const userMsg: TrainingMessage = {
      id: Date.now().toString(),
      role: "user_rep",
      text: userInput.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");

    const reply = userMsg.text.toLowerCase();
    if (reply.length > 60) setEncouragement("Great detail — that's how you build credibility");
    else if (reply.includes("understand") || reply.includes("hear you"))
      setEncouragement("Excellent — acknowledging the prospect's concern first");
    else if (reply.includes(" ROI ") || reply.includes("cost") || reply.includes("save"))
      setEncouragement("Smart move — quantifying the value");
    else if (reply.includes("?"))
      setEncouragement("Good — keeping the conversation going with questions");
    else setEncouragement("Keep going — you're building momentum");
    setTimeout(() => setEncouragement(null), 3000);

    const history = [...messages, userMsg];

    if (history.length >= 6) {
      await generateScore(history);
      return;
    }

    await executeTurn(
      {
        mode: "turn",
        objection: selectedObjection,
        difficulty,
        messages: history.map((m) => ({
          role: m.role === "ai_prospect" ? "model" : "user",
          text: m.text,
        })),
        icp: icp || null,
      },
      (result) => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "ai_prospect",
            text: result.text || "Hmm, I'm not fully convinced. Can you give me more specifics?",
          },
        ]);
      },
    );
  };

  const generateScore = async (allMessages: TrainingMessage[]) => {
    await executeTurn(
      {
        mode: "score",
        objection: selectedObjection,
        difficulty,
        messages: allMessages.map((m) => ({
          role: m.role === "ai_prospect" ? "model" : "user",
          text: m.text,
        })),
        icp: icp || null,
      },
      (result) => {
        setScoreResult({
          overallScore: Math.min(100, Math.max(0, result.score ?? 65)),
          strengths: result.strengths?.length ? result.strengths : ["Good opening response"],
          improvements: result.improvements?.length
            ? result.improvements
            : ["Be more specific with data"],
          rebuttalTip: result.rebuttal_tip || "Try acknowledging the objection before rebutting.",
        });
        setMode("review");
      },
    );
  };

  const resetTraining = () => {
    setMode("setup");
    setMessages([]);
    setScoreResult(null);
    setUserInput("");
    setError(null);
    pendingRef.current = null;
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-500" : "text-red-500";

  const scoreBg = (score: number) =>
    score >= 80
      ? "bg-emerald-50 border-emerald-200"
      : score >= 60
        ? "bg-amber-50 border-amber-200"
        : "bg-red-50 border-red-200";

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto py-6 px-4 lg:px-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-coral)] to-[#e84b1a] flex items-center justify-center shadow-[var(--shadow-coral)]">
          <Swords className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            AI Sales Coach
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Your personal trainer for handling tough objections before real calls.
          </p>
        </div>
      </div>

      {mode === "setup" && (
        <div className="space-y-5 stagger-children">
          {/* Select Objection */}
          <div className="card p-6">
            <h2 className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-[0.15em] mb-4 flex items-center gap-2 font-bold">
              <div className="w-5 h-5 rounded-md bg-[var(--accent-coral-light)] flex items-center justify-center">
                <Shield className="w-3 h-3 text-[var(--accent-coral)]" />
              </div>
              Select an Objection to Practice
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {icpObjections.map((obj, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedObjection(obj)}
                  className={`text-left px-4 py-3.5 rounded-xl text-sm transition-all border font-medium ${
                    selectedObjection === obj
                      ? "bg-[var(--accent-coral-light)] text-[var(--accent-coral)] border-[var(--accent-coral-medium)] shadow-sm"
                      : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-hover)] hover:shadow-sm"
                  }`}
                >
                  <Zap className="w-3 h-3 inline mr-2 opacity-60" />"{obj}"
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="card p-6">
            <h2 className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-[0.15em] mb-4 font-bold">
              Difficulty Level
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  {
                    key: "easy",
                    label: "Rookie",
                    desc: "Receptive prospect",
                    color: "emerald",
                    bgClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
                  },
                  {
                    key: "medium",
                    label: "Pro",
                    desc: "Firm pushback",
                    color: "amber",
                    bgClass: "bg-amber-50 border-amber-200 text-amber-700",
                  },
                  {
                    key: "hard",
                    label: "Elite",
                    desc: "Aggressive resistance",
                    color: "red",
                    bgClass: "bg-red-50 border-red-200 text-red-700",
                  },
                ] as const
              ).map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={`p-4 rounded-xl border text-center transition-all card-hover ${
                    difficulty === d.key
                      ? d.bgClass
                      : "bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <div className="text-sm font-bold">{d.label}</div>
                  <div className="text-[11px] mt-1 opacity-70">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startSparring}
            disabled={!selectedObjection}
            className="w-full btn-coral py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed btn-press"
          >
            <Play className="w-5 h-5" /> Start Sparring Session
          </button>
        </div>
      )}

      {mode === "sparring" && (
        <div className="flex flex-col flex-1 animate-fade-in">
          {/* Objection Badge */}
          <div className="bg-[var(--accent-coral-light)] border border-[var(--accent-coral-medium)] rounded-xl px-4 py-2.5 mb-2 text-xs text-[var(--accent-coral)] flex items-center gap-2 font-bold">
            <Swords className="w-3.5 h-3.5" />
            <span>Active Objection:</span> "{selectedObjection}"
            <span className="ml-auto text-[var(--text-muted)] font-mono">
              {Math.ceil(messages.length / 2)}/3 rounds
            </span>
          </div>
          {encouragement && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-emerald-700 flex items-center gap-2 font-bold animate-slide-in-down">
              💬 {encouragement}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-xs text-red-700 flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <div className="font-bold mb-0.5">
                  Coach request failed — nothing was generated.
                </div>
                <div className="font-mono text-[11px] text-red-500 break-all">{error}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={retryPending}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-100 transition-all disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} /> Retry
                </button>
                <button
                  onClick={resetTraining}
                  className="font-bold px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-100 transition-all"
                >
                  End
                </button>
              </div>
            </div>
          )}

          {/* Chat */}
          <div className="flex-1 card rounded-2xl p-5 overflow-y-auto mb-4 space-y-4 min-h-[300px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-transcript-bubble ${msg.role === "user_rep" ? "justify-end" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === "ai_prospect"
                      ? "bg-red-50 text-red-500 border border-red-200"
                      : "bg-blue-50 text-blue-500 border border-blue-200"
                  }`}
                >
                  {msg.role === "ai_prospect" ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "ai_prospect"
                      ? "bg-red-50 text-red-900 border border-red-100"
                      : "bg-blue-50 text-blue-900 border border-blue-100"
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-50 mb-1">
                    {msg.role === "ai_prospect" ? "PROSPECT" : "YOU"}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                  <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                  <span className="dot-bounce-1 w-1.5 h-1.5 bg-red-400 rounded-full inline-block"></span>
                  <span className="dot-bounce-2 w-1.5 h-1.5 bg-red-400 rounded-full inline-block"></span>
                  <span className="dot-bounce-3 w-1.5 h-1.5 bg-red-400 rounded-full inline-block"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendReply()}
              placeholder="Type your rebuttal..."
              className="input-field flex-1 rounded-xl"
              disabled={isLoading || !!error}
            />
            <button
              onClick={sendReply}
              disabled={!userInput.trim() || isLoading || !!error}
              className="btn-coral px-6 py-3 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed btn-press"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => generateScore(messages)}
              disabled={messages.length < 2 || isLoading}
              className="btn-ghost px-4 py-3 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed btn-press"
              title="End session and get score"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {mode === "review" && scoreResult && (
        <div className="space-y-5 stagger-children">
          {/* Score Card */}
          <div
            className={`card rounded-2xl p-8 text-center border ${scoreBg(scoreResult.overallScore)}`}
          >
            <div
              className={`text-7xl font-black tabular-nums ${scoreColor(scoreResult.overallScore)} animate-count-up`}
            >
              {scoreResult.overallScore}
            </div>
            <div className="text-[var(--text-muted)] text-sm mt-2 font-medium">
              Objection Handling Score
            </div>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-5 h-5 transition-all ${n <= Math.ceil(scoreResult.overallScore / 20) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                />
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card rounded-2xl p-5 border-emerald-100">
              <h3 className="text-xs font-mono text-emerald-600 uppercase tracking-[0.15em] mb-3 font-bold flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center">
                  ✅
                </div>
                What You Did Well
              </h3>
              <ul className="space-y-2">
                {scoreResult.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-emerald-800 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-100 leading-relaxed"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card rounded-2xl p-5 border-amber-100">
              <h3 className="text-xs font-mono text-amber-600 uppercase tracking-[0.15em] mb-3 font-bold flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center">
                  🔧
                </div>
                Areas to Improve
              </h3>
              <ul className="space-y-2">
                {scoreResult.improvements.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-100 leading-relaxed"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Coach's Tip */}
          <div className="card rounded-2xl p-5 border-purple-100 bg-purple-50/30">
            <h3 className="text-xs font-mono text-purple-600 uppercase tracking-[0.15em] mb-3 font-bold flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center">
                <MessageCircle className="w-3 h-3 text-purple-500" />
              </div>
              Coach's Rebuttal Tip
            </h3>
            <p className="text-sm text-purple-800 leading-relaxed">{scoreResult.rebuttalTip}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={resetTraining}
              className="flex-1 btn-ghost flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold btn-press"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => {
                setSelectedObjection("");
                resetTraining();
              }}
              className="flex-1 btn-coral flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold btn-press"
            >
              <Swords className="w-4 h-4" /> New Objection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
