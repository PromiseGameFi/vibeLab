import Link from "next/link";
import { ArrowLeft, Ghost } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 animate-bounce">
                <Ghost className="w-12 h-12 text-white/20" />
            </div>

            <h1 className="text-5xl font-black mb-4 tracking-tighter">404: Lost in the <span className="text-gradient">Latent Space</span></h1>

            <p className="text-white/40 text-lg max-w-md mb-12">
                We couldn't find that tool in our database. It might be under development or hallucinated.
            </p>

            <Link
                href="/"
                className="px-8 py-4 rounded-full bg-accent-primary text-white font-bold flex items-center gap-2 hover:bg-accent-secondary transition-all duration-300 vibe-glow"
            >
                <ArrowLeft className="w-4 h-4" />
                Return to Directory
            </Link>
        </div>
    );
}
