import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Productivity Nexus",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(265 90% 65%), hsl(265 70% 45%))" }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Productivity Nexus</span>
          </Link>
        </div>

        <div className="prose prose-invert prose-indigo max-w-none">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: June 3, 2026</p>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Productivity Nexus, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
            <p>
              Productivity Nexus is a personal productivity application providing task management, calendar integrations, and AI-assisted scheduling. The service is provided "as is" and "as available".
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password or credentials that you use to access the service and for any activities or actions under your password.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">4. Acceptable Use</h2>
            <p>You agree not to use the application to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe upon the rights of others.</li>
              <li>Attempt to gain unauthorized access to the application's systems or data.</li>
              <li>Upload malicious code, viruses, or disruptive material.</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
            <p>
              The service and its original content (excluding user-provided content), features, and functionality are and will remain the exclusive property of Productivity Nexus and its licensors.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">6. Limitation of Liability</h2>
            <p>
              In no event shall Productivity Nexus, nor its developers or partners, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant changes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
