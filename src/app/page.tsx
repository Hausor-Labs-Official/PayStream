import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Paystream AI</h1>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Get Started</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button>Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </Link>
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="text-5xl font-semibold text-foreground mb-6">
          AI-Powered Payroll on Arc
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Streamline your payroll with USDC on Arc Testnet using AI and blockchain technology
        </p>
        <div className="flex gap-4 justify-center">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="text-base">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" className="text-base">
                Open Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'AI Integration', desc: 'Google Gemini 2.0 Flash for intelligent payroll processing' },
            { title: 'Blockchain Security', desc: 'Circle Developer-Controlled Wallets on Arc Testnet' },
            { title: 'USDC Payments', desc: 'Fast, secure USDC payments on Arc blockchain' },
            { title: 'Batch Processing', desc: 'Process multiple payroll payments efficiently' },
            { title: 'Supabase Database', desc: 'Reliable employee and payment data storage' },
            { title: 'AI Assistant', desc: 'Penny AI helps with payroll questions and insights' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
