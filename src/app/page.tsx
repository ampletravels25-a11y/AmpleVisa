import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, Shield, FileText, Zap, CheckCircle, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AV</span>
            </div>
            <span className="text-xl font-bold text-blue-800">AmpleVisa</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-700 hover:bg-blue-800">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 tracking-tight">
            Corporate Visa Management
            <br />
            <span className="text-blue-700">Made Simple</span>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
            Streamline your company&apos;s visa applications from start to finish.
            Browse requirements, apply online, track progress — all in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-lg px-8">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Everything you need for visa management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Globe,
                title: "Country Information",
                description: "Browse visa requirements for any country with detailed guides and checklists",
              },
              {
                icon: FileText,
                title: "Online Applications",
                description: "Apply for visas entirely online with guided forms and document upload",
              },
              {
                icon: Zap,
                title: "Real-time Tracking",
                description: "Track your application status in real-time with instant notifications",
              },
              {
                icon: Shield,
                title: "Secure & Compliant",
                description: "Enterprise-grade security with encrypted data storage and audit trails",
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            How it works
          </h2>
          <div className="space-y-8">
            {[
              { step: "1", title: "Sign up with your corporate email", description: "Create your account using your company email address. Your company profile is set up automatically." },
              { step: "2", title: "Browse country & visa information", description: "Explore detailed visa requirements, documents needed, processing times, and fees for each country." },
              { step: "3", title: "Apply online", description: "Fill in the application form, upload your documents, and submit — all in a guided step-by-step process." },
              { step: "4", title: "Track and receive your visa", description: "Monitor your application in real-time. Get notified at every step until your visa is issued." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Trusted by corporate teams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "End-to-end encrypted document handling",
              "GDPR compliant data management",
              "Complete audit trail for every action",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to simplify your visa process?
          </h2>
          <p className="text-slate-600 mb-8">
            Join companies already using AmpleVisa for hassle-free visa management.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-lg px-8">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">AV</span>
            </div>
            <span className="text-sm text-slate-500">&copy; 2026 AmpleVisa. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900">Terms of Service</a>
            <a href="#" className="hover:text-slate-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
