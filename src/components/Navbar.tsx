"use client";

import Link from "next/link";
import { Orbit } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <Orbit className="w-6 h-6 text-white" />
                    <span className="text-lg font-semibold text-white">
                        VibeLab
                    </span>
                </Link>

                {/* Center Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        href="/"
                        className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors"
                    >
                        Product
                    </Link>
                    <Link
                        href="/vibeMarket"
                        className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors"
                    >
                        VibeMarket
                    </Link>
                    <Link
                        href="/skills"
                        className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors"
                    >
                        Skills
                    </Link>
                    <Link
                        href="/#tools"
                        className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors"
                    >
                        Tools
                    </Link>
                </div>
            </div>
        </nav>
    );
}
