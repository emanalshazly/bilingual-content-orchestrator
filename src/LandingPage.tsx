import React from 'react';
import { motion } from 'motion/react';
import { Globe, Zap, ShieldCheck, Languages, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';

export default function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold text-zinc-100">Bilingual Content Orchestrator</span>
          </div>
          <button
            onClick={onLaunch}
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
                Scale your content <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                  across cultures.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
                An AI-powered pipeline that transforms a single product brief into a complete, culturally-tuned marketing campaign in both English and Arabic.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={onLaunch}
                  className="flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                >
                  Launch Dashboard <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-24">
            <FeatureCard 
              icon={<Languages className="w-6 h-6 text-blue-400" />}
              title="Culturally Tuned"
              description="Beyond translation. Adapts pacing, dialect (MSA, Gulf, Levantine), and cultural references for MENA audiences."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-400" />}
              title="Multi-Channel Fan-Out"
              description="Generates optimized copy for Blogs, Social Media, Email Marketing, and Video Scripts simultaneously."
              delay={0.2}
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
              title="Automated QA"
              description="Built-in Brand Voice Review and Quality Evaluator agents ensure every piece meets publication standards."
              delay={0.3}
            />
          </div>

          {/* Visual Pipeline Representation */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
            <div className="text-center mb-12 relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">A multi-agent architecture designed for high-quality, consistent output.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 relative z-10">
              <Step number="1" title="Input Brief" icon={<FileText className="w-5 h-5" />} />
              <div className="w-px h-8 md:w-16 md:h-px bg-zinc-700" />
              <Step number="2" title="Core Messaging" icon={<Zap className="w-5 h-5" />} />
              <div className="w-px h-8 md:w-16 md:h-px bg-zinc-700" />
              <div className="flex flex-col gap-4">
                <Step number="3a" title="EN Fan-Out" icon={<Globe className="w-5 h-5" />} />
                <Step number="3b" title="AR Fan-Out" icon={<Languages className="w-5 h-5" />} />
              </div>
              <div className="w-px h-8 md:w-16 md:h-px bg-zinc-700" />
              <Step number="4" title="Review & QA" icon={<CheckCircle2 className="w-5 h-5" />} />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function Step({ number, title, icon }: { number: string, title: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-300 shadow-lg relative">
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {number}
        </div>
        {icon}
      </div>
      <span className="text-sm font-medium text-zinc-300">{title}</span>
    </div>
  );
}
