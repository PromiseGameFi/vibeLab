"use client";

import Link from "next/link";
import { Search, Orbit, BookOpen, Info, User } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none">
            <div className="w-full max-w-6xl vibe-glass rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto border-gradient">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center group-hover:bg-accent-secondary transition-colors duration-300">
                        <Orbit className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-gradient">VibeLab</span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
                    <Link href="/" className="hover:text-white transition-colors">
                        Blueprints
                    </Link>
                    <Link href="/" className="hover:text-white transition-colors">
                        Stacks
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full border border-accent-primary/50 bg-accent-primary/10 text-accent-primary text-xs font-bold hover:bg-accent-primary hover:text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                    >
                        Submit Blueprint
                    </a>
                </div>
            </div>
        </nav>
    );
}
