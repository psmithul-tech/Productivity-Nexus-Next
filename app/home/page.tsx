import Link from "next/link";
import { Zap, Calendar, CheckSquare, BrainCircuit } from "lucide-react";

export const metadata = {
  title: "Restia | Smart Productivity OS",
  description: "Restia is an AI-powered personal productivity app that combines task management, calendar intelligence, smart reminders, and an AI scheduling assistant.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(265 90% 65%), hsl(265 70% 45%))" }}>
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">Restia</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20 max-w-5xl mx-auto w-full">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
          The Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Operating System</span> for your Life.
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Restia is an AI-powered personal productivity application designed to streamline your daily workflow. It combines intelligent task management, seamless calendar integration, smart reminders, and a built-in AI assistant to help you achieve your goals faster.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl mx-auto mb-16">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <CheckSquare className="h-10 w-10 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Task Management</h3>
            <p className="text-sm text-muted-foreground">Organize your daily tasks, set priorities, and track your progress efficiently.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <Calendar className="h-10 w-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Calendar Sync</h3>
            <p className="text-sm text-muted-foreground">Sync your events and never miss a meeting with our unified calendar intelligence.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <BrainCircuit className="h-10 w-10 text-pink-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">Let the built-in Gemini AI schedule your week, summarize tasks, and answer questions.</p>
          </div>
        </div>

        {/* Google OAuth Data Transparency Section */}
        <div className="w-full max-w-4xl mx-auto mb-16 p-8 rounded-2xl bg-white/5 border border-indigo-500/30 text-left">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="text-indigo-400">Data Transparency & Privacy</span>
          </h2>
          <p className="text-muted-foreground mb-4">
            Restia prioritizes your privacy. We explicitly request access to your Google Calendar to provide core functionality:
          </p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2 mb-6">
            <li>Syncing your upcoming events directly into your Restia dashboard.</li>
            <li>Allowing the built-in AI Assistant to view your schedule and help you plan your week.</li>
            <li>Triggering smart reminders based on your calendar events.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            We only request the minimum permissions required to make these features work. Your calendar data is securely stored, never sold to third parties, and is only used to enhance your personal productivity experience.
          </p>
        </div>

        <Link href="/login" className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform">
          Get Started for Free
        </Link>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-white/10 mt-auto">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
        <p>© 2026 Restia. All rights reserved.</p>
      </footer>
    </div>
  );
}
