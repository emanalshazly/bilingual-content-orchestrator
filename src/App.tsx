import React, { useState, useRef, useEffect } from "react";
import { Play, Square, CheckCircle2, CircleDashed, Loader2, FileText, Globe, Mail, Video, ShieldCheck, Award, AlertCircle, Pencil, Save, X, Undo, Redo } from "lucide-react";
import { motion } from "motion/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { cn } from "./lib/utils";
import { executePipeline, reRunAgent, PipelineState, PipelineOutputs, AgentStatus, PipelineInputs } from "./lib/orchestrator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import LandingPage from "./LandingPage";
import * as schemas from "./lib/schemas";

const DEFAULT_INPUTS: PipelineInputs = {
  productBrief: "Acme launches Compass, its first AI-powered analytics dashboard for mid-market operations teams. Reduces reporting time by 70% in beta. Connects to 40+ tools out of the box. No SQL required.",
  brandGuidelines: "Voice: Direct without being blunt, Knowledgeable without being academic, Optimistic but grounded in evidence. Forbidden phrases: game-changing, revolutionary, best-in-class, seamless, robust. Arabic: MSA for written, Gulf dialect acceptable for video if GCC-targeted.",
  previousExamplesEN: "Example Blog: How to save 10 hours a week on reporting. We know operations teams are stretched thin. That's why we built a tool that does the heavy lifting.",
  previousExamplesAR: "مثال لمدونة: كيف توفر 10 ساعات أسبوعياً في إعداد التقارير. نعلم أن فرق العمليات تواجه ضغوطاً كبيرة. لذلك صممنا أداة تقوم بالعمل الشاق.",
  seoKeywords: "analytics dashboard, reporting automation, operations efficiency"
};

const INITIAL_STATE: PipelineState = {
  core: "idle",
  enBlog: "idle",
  enSocial: "idle",
  enEmail: "idle",
  enVideo: "idle",
  arBlog: "idle",
  arSocial: "idle",
  arEmail: "idle",
  arVideo: "idle",
  brandReview: "idle",
  qualityEval: "idle",
};

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [inputs, setInputs] = useState<PipelineInputs>(DEFAULT_INPUTS);
  const [status, setStatus] = useState<PipelineState>(INITIAL_STATE);
  const [outputs, setOutputs] = useState<PipelineOutputs>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [editingOutput, setEditingOutput] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof PipelineOutputs | "inputs">("inputs");
  const [error, setError] = useState<string | null>(null);
  const [viewLanguage, setViewLanguage] = useState<"en" | "ar">("en");

  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  const handleLanguageSwitch = (lang: "en" | "ar") => {
    setViewLanguage(lang);
    if (activeTab !== "inputs" && activeTab !== "core" && activeTab !== "brandReview" && activeTab !== "qualityEval") {
      if (lang === "ar" && activeTab.startsWith("en")) {
        setActiveTab(activeTab.replace("en", "ar") as keyof PipelineOutputs);
      } else if (lang === "en" && activeTab.startsWith("ar")) {
        setActiveTab(activeTab.replace("ar", "en") as keyof PipelineOutputs);
      }
    }
  };

  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
    }
  };

  const convertToJSONSchema = (schema: any): any => {
    if (!schema) return schema;
    const result = { ...schema };
    if (result.type) {
      result.type = result.type.toLowerCase();
    }
    if (result.properties) {
      const newProps: any = {};
      for (const key in result.properties) {
        newProps[key] = convertToJSONSchema(result.properties[key]);
      }
      result.properties = newProps;
    }
    if (result.items) {
      result.items = convertToJSONSchema(result.items);
    }
    return result;
  };

  useEffect(() => {
    if (monaco && editingOutput) {
      const schemaName = `${editingOutput}Schema`;
      const schema = (schemas as any)[schemaName];
      if (schema) {
        (monaco.languages as any).json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [{
            uri: `http://internal/${schemaName}.json`,
            fileMatch: ["*"],
            schema: convertToJSONSchema(schema)
          }]
        });
      } else {
        (monaco.languages as any).json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: []
        });
      }
    }
  }, [monaco, editingOutput]);

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    setEditValue(val);
    try {
      JSON.parse(val);
      setEditError(null);
    } catch (err: any) {
      setEditError(err.message);
    }
  };

  const handleReRun = async (agentId: keyof PipelineOutputs) => {
    const feedback = feedbacks[agentId] || "";
    setError(null);
    try {
      await reRunAgent(
        agentId,
        inputs,
        outputs,
        feedback,
        (agent, newStatus) => setStatus((prev) => ({ ...prev, [agent]: newStatus })),
        (agent, data) => setOutputs((prev) => ({ ...prev, [agent]: data }))
      );
      setFeedbacks((prev) => ({ ...prev, [agentId]: "" }));
    } catch (err: any) {
      setError(err.message || `An error occurred while re-running ${agentId}.`);
    }
  };

  const handleSaveEdit = (agentId: keyof PipelineOutputs) => {
    try {
      const parsed = JSON.parse(editValue);
      setOutputs(prev => ({ ...prev, [agentId]: parsed }));
      setEditingOutput(null);
      setError(null);
    } catch (err) {
      setError("Invalid JSON. Please fix errors before saving.");
    }
  };

  const startEditing = (agentId: keyof PipelineOutputs) => {
    setEditValue(JSON.stringify(outputs[agentId], null, 2));
    setEditingOutput(agentId);
    setEditError(null);
  };

  const getChartData = (scores: Record<string, number>) => {
    if (!scores) return [];
    return Object.entries(scores).map(([key, value]) => ({
      name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      score: value
    }));
  };

  const getVerdictChartData = (verdicts: Record<string, string>) => {
    if (!verdicts) return [];
    return Object.entries(verdicts).map(([key, value]) => ({
      name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      score: value === 'PASS' ? 10 : value === 'REVISE' ? 5 : 0,
      verdict: value
    }));
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'PASS') return '#22c55e';
    if (verdict === 'REVISE') return '#eab308';
    return '#ef4444';
  };

  const VerdictTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="text-zinc-300 font-medium mb-1">{data.name}</p>
          <p className="text-sm font-bold" style={{ color: getVerdictColor(data.verdict) }}>
            {data.verdict}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleStart = async () => {
    setIsRunning(true);
    setError(null);
    setStatus(INITIAL_STATE);
    setOutputs({});
    setActiveTab("core");

    try {
      await executePipeline(
        inputs,
        (agent, newStatus) => setStatus((prev) => ({ ...prev, [agent]: newStatus })),
        (agent, data) => setOutputs((prev) => ({ ...prev, [agent]: data }))
      );
    } catch (err: any) {
      setError(err.message || "An error occurred during pipeline execution.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = () => {
    let content = "# Campaign Assets\n\n";
    
    Object.entries(outputs).forEach(([key, data]) => {
      if (key === 'qualityEval' || key === 'brandReview') return; // Skip QA metrics in export
      
      content += `## ${key.toUpperCase()}\n\n`;
      content += "```json\n";
      content += JSON.stringify(data, null, 2);
      content += "\n```\n\n";
      content += "---\n\n";
    });

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-assets-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderAgentNode = (id: keyof PipelineState, label: string, icon: React.ReactNode, delay: number = 0) => {
    const s = status[id];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        onClick={() => s === "complete" && setActiveTab(id)}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-lg border bg-zinc-900/50 backdrop-blur-sm transition-all",
          s === "idle" && "border-zinc-800 text-zinc-500",
          s === "running" && "border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
          s === "complete" && "border-green-500/50 text-green-400 cursor-pointer hover:bg-zinc-800",
          s === "error" && "border-red-500/50 text-red-400"
        )}
      >
        <div className="shrink-0">
          {s === "idle" && <CircleDashed className="w-5 h-5" />}
          {s === "running" && <Loader2 className="w-5 h-5 animate-spin" />}
          {s === "complete" && <CheckCircle2 className="w-5 h-5" />}
          {s === "error" && <AlertCircle className="w-5 h-5" />}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-200 flex items-center gap-2">
            {icon} {label}
          </span>
          <span className="text-xs opacity-70">
            {s === "idle" && "Waiting"}
            {s === "running" && "Processing..."}
            {s === "complete" && "Done"}
            {s === "error" && "Failed"}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {!showDashboard ? (
        <LandingPage onLaunch={() => setShowDashboard(true)} />
      ) : (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-blue-500/30">
          {/* Header */}
          <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-semibold text-zinc-100">Bilingual Content Orchestrator</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 mr-2">
              <button
                onClick={() => handleLanguageSwitch("en")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  viewLanguage === "en" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageSwitch("ar")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  viewLanguage === "ar" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Arabic
              </button>
            </div>
            {Object.keys(outputs).length > 0 && status.core === "complete" && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-sm font-medium border border-zinc-700"
              >
                <FileText className="w-4 h-4" /> Download Assets
              </button>
            )}
            {isRunning ? (
              <button disabled className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 text-zinc-400 cursor-not-allowed text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin" /> Running Pipeline...
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium"
              >
                <Play className="w-4 h-4" /> Start Pipeline
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Pipeline Visualization */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Pipeline Status
            </h2>
            
            <div className="space-y-6 relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-6 bottom-6 w-px bg-zinc-800 -z-10" />

              {/* Step 1 */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-500 ml-12">PHASE 1: EXTRACTION</div>
                {renderAgentNode("core", "Core Messaging", <FileText className="w-4 h-4" />, 0.1)}
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-500 ml-12">PHASE 2: EN FAN-OUT</div>
                <div className="grid grid-cols-1 gap-3 pl-8 border-l border-zinc-800/50 ml-6">
                  {renderAgentNode("enBlog", "EN Blog", <FileText className="w-4 h-4" />, 0.2)}
                  {renderAgentNode("enSocial", "EN Social", <Globe className="w-4 h-4" />, 0.3)}
                  {renderAgentNode("enEmail", "EN Email", <Mail className="w-4 h-4" />, 0.4)}
                  {renderAgentNode("enVideo", "EN Video", <Video className="w-4 h-4" />, 0.5)}
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-500 ml-12">PHASE 3: AR FAN-OUT</div>
                <div className="grid grid-cols-1 gap-3 pl-8 border-l border-zinc-800/50 ml-6">
                  {renderAgentNode("arBlog", "AR Blog", <FileText className="w-4 h-4" />, 0.6)}
                  {renderAgentNode("arSocial", "AR Social", <Globe className="w-4 h-4" />, 0.7)}
                  {renderAgentNode("arEmail", "AR Email", <Mail className="w-4 h-4" />, 0.8)}
                  {renderAgentNode("arVideo", "AR Video", <Video className="w-4 h-4" />, 0.9)}
                </div>
              </div>

              {/* Step 4 & 5 */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-500 ml-12">PHASE 4: REVIEW & QA</div>
                {renderAgentNode("brandReview", "Brand Voice Review", <ShieldCheck className="w-4 h-4" />, 1.0)}
                {renderAgentNode("qualityEval", "Quality Evaluator", <Award className="w-4 h-4" />, 1.1)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inputs & Outputs */}
        <div className="lg:col-span-8">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
            
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-950/50 p-2 gap-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab("inputs")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                  activeTab === "inputs" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                Inputs
              </button>
              {Object.keys(INITIAL_STATE).map((key) => {
                const k = key as keyof PipelineOutputs;
                if (!outputs[k] && status[k] === "idle") return null;
                
                if (viewLanguage === "en" && k.startsWith("ar")) return null;
                if (viewLanguage === "ar" && k.startsWith("en")) return null;

                return (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2",
                      activeTab === k ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    )}
                  >
                    {status[k] === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
                    {status[k] === "complete" && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    {k.replace(/^(en|ar)/, '')}
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0f0f0f]">
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Pipeline Error</h3>
                    <p className="text-sm opacity-80 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {activeTab === "inputs" ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-2">PRODUCT BRIEF</label>
                    <textarea
                      value={inputs.productBrief}
                      onChange={(e) => setInputs({ ...inputs, productBrief: e.target.value })}
                      className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-2">BRAND GUIDELINES</label>
                    <textarea
                      value={inputs.brandGuidelines}
                      onChange={(e) => setInputs({ ...inputs, brandGuidelines: e.target.value })}
                      className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-2">SEO KEYWORDS (Comma separated)</label>
                    <input
                      value={inputs.seoKeywords}
                      onChange={(e) => setInputs({ ...inputs, seoKeywords: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                      placeholder="e.g. analytics dashboard, reporting automation"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-mono text-zinc-500 mb-2">PREVIOUS EXAMPLES (EN)</label>
                      <textarea
                        value={inputs.previousExamplesEN}
                        onChange={(e) => setInputs({ ...inputs, previousExamplesEN: e.target.value })}
                        className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-zinc-500 mb-2">PREVIOUS EXAMPLES (AR)</label>
                      <textarea
                        value={inputs.previousExamplesAR}
                        onChange={(e) => setInputs({ ...inputs, previousExamplesAR: e.target.value })}
                        className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>
              ) : activeTab === "qualityEval" && outputs.qualityEval ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center gap-4 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                    <div className={cn(
                      "px-4 py-2 rounded-lg font-bold text-lg tracking-wider",
                      outputs.qualityEval.verdict === 'PASS' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      outputs.qualityEval.verdict === 'FAIL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    )}>
                      {outputs.qualityEval.verdict}
                    </div>
                    <div className="text-2xl font-light text-zinc-300">
                      Overall Score: <span className="font-semibold text-white">{outputs.qualityEval.score}</span><span className="text-zinc-500 text-lg">/10</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-400" /> Dimension Scores
                    </h3>
                    <div className="h-80 w-full bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData(outputs.qualityEval.dimension_scores)} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                          <XAxis type="number" domain={[0, 10]} stroke="#71717a" />
                          <YAxis dataKey="name" type="category" width={180} stroke="#a1a1aa" tick={{fontSize: 12}} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                            itemStyle={{ color: '#3b82f6' }}
                            cursor={{fill: '#27272a', opacity: 0.4}}
                          />
                          <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" /> Per-Piece Verdicts
                    </h3>
                    <div className="h-80 w-full bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getVerdictChartData(outputs.qualityEval.per_piece_verdicts)} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                          <XAxis 
                            type="number" 
                            domain={[0, 10]} 
                            stroke="#71717a" 
                            ticks={[0, 5, 10]} 
                            tickFormatter={(val) => val === 10 ? 'PASS' : val === 5 ? 'REVISE' : val === 0 ? 'FAIL' : ''} 
                          />
                          <YAxis dataKey="name" type="category" width={120} stroke="#a1a1aa" tick={{fontSize: 12}} />
                          <Tooltip content={<VerdictTooltip />} cursor={{fill: '#27272a', opacity: 0.4}} />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                            {getVerdictChartData(outputs.qualityEval.per_piece_verdicts).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getVerdictColor(entry.verdict)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {outputs.qualityEval.revision_instructions && outputs.qualityEval.revision_instructions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" /> Revision Instructions
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300 bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
                        {outputs.qualityEval.revision_instructions.map((inst: string, idx: number) => (
                          <li key={idx} className="pl-2">{inst}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Revision UI for qualityEval */}
                  <div className="mt-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 shrink-0">
                    <label className="block text-xs font-mono text-zinc-500 mb-2">REVISION FEEDBACK (Optional)</label>
                    <div className="flex gap-3">
                      <textarea
                        value={feedbacks.qualityEval || ""}
                        onChange={(e) => setFeedbacks({ ...feedbacks, qualityEval: e.target.value })}
                        placeholder="Enter feedback to revise the evaluation..."
                        className="flex-1 h-20 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none"
                      />
                      <button
                        onClick={() => handleReRun("qualityEval")}
                        disabled={status.qualityEval === "running"}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium flex items-center gap-2 h-fit"
                      >
                        <Play className="w-4 h-4" /> Re-run Agent
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col h-full">
                  {status[activeTab as keyof PipelineOutputs] === "running" ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-sm font-mono animate-pulse">Agent is generating output...</p>
                    </div>
                  ) : outputs[activeTab as keyof PipelineOutputs] ? (
                    <>
                      <div className="flex-1 overflow-y-auto relative">
                        {editingOutput === activeTab ? (
                          <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-mono text-zinc-500">MANUAL EDIT MODE (Must be valid JSON)</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleUndo}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                                  title="Undo"
                                >
                                  <Undo className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={handleRedo}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                                  title="Redo"
                                >
                                  <Redo className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingOutput(null)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                                >
                                  <X className="w-3 h-3" /> Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(activeTab as keyof PipelineOutputs)}
                                  disabled={!!editError}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Save className="w-3 h-3" /> Save Changes
                                </button>
                              </div>
                            </div>
                            <div className="flex-1 w-full bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden relative">
                              <Editor
                                height="100%"
                                defaultLanguage="json"
                                theme="vs-dark"
                                value={editValue}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  wordWrap: "on",
                                  scrollBeyondLastLine: false,
                                  formatOnPaste: true,
                                  padding: { top: 16, bottom: 16 },
                                  folding: true,
                                  showFoldingControls: "always"
                                }}
                              />
                            </div>
                            {editError && (
                              <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {editError}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              onClick={() => startEditing(activeTab as keyof PipelineOutputs)}
                              className="absolute top-4 right-4 p-2 rounded-md bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                              title="Edit JSON Output"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <pre className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-sm font-mono text-zinc-300 whitespace-pre-wrap">
                              {JSON.stringify(outputs[activeTab as keyof PipelineOutputs], null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      
                      {/* Revision UI */}
                      <div className="mt-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 shrink-0">
                        <label className="block text-xs font-mono text-zinc-500 mb-2">REVISION FEEDBACK (Optional)</label>
                        <div className="flex gap-3">
                          <textarea
                            value={feedbacks[activeTab] || ""}
                            onChange={(e) => setFeedbacks({ ...feedbacks, [activeTab]: e.target.value })}
                            placeholder="Enter feedback to revise this content..."
                            className="flex-1 h-20 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none"
                            disabled={editingOutput === activeTab}
                          />
                          <button
                            onClick={() => handleReRun(activeTab as keyof PipelineOutputs)}
                            disabled={status[activeTab as keyof PipelineOutputs] === "running" || editingOutput === activeTab}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium flex items-center gap-2 h-fit disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Play className="w-4 h-4" /> Re-run Agent
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-zinc-600 text-sm font-mono">
                      No output available yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
      )}
    </>
  );
}
