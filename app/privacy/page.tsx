import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Productivity Nexus",
};

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: June 3, 2026</p>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            <p>
              When you use Productivity Nexus, we collect information you provide directly to us, such as when you create an account, create tasks, events, and reminders, or communicate with us.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> We collect your name, email address, and profile picture (if authenticated via Google) to provide you with an account.</li>
              <li><strong>User Content:</strong> We securely store the tasks, calendar events, reminders, and settings you create within the app to sync them across your devices.</li>
              <li><strong>Usage Data:</strong> We may collect anonymous analytics data to improve the application experience.</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">2. How We Use Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services.</li>
              <li>Process transactions and send related information.</li>
              <li>Send you technical notices, updates, security alerts, and support messages.</li>
              <li>Respond to your comments, questions, and requests.</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">3. Third-Party Services & Google API</h2>
            <p>
              Productivity Nexus uses Supabase for database storage and authentication. We do not sell your personal data to any third-party services.
            </p>
            <p>
              If you choose to authenticate via Google, our app complies with the Google API Services User Data Policy, including the Limited Use requirements. Your data accessed through Google APIs is only used to provide or improve user-facing features.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">4. Data Security</h2>
            <p>
              We implement reasonable security measures to protect the security of your personal information both online and offline. Passwords (if used) are hashed securely, and database access is restricted.
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact the developer directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
