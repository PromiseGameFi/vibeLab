"use client";

import { useState } from "react";
import Link from "next/link";
import { Orbit, Menu, X } from "lucide-react";

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className="navbar relative z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group" onClick={closeMenu}>
                    <Orbit className="w-6 h-6 text-white" />
                    <span className="text-lg font-semibold text-white">
                        VibeLab
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/" className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">Product</Link>
                    <Link href="/vibeMarket" className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">VibeMarket</Link>
                    <Link href="/scan" className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">Scan</Link>
                    <Link href="/memory" className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">Memory</Link>
                    <Link href="/skills" className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">Skills</Link>
                    <Link href="/brain" className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">Brain</Link>
                    <Link href="/predictions" className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">Predictions</Link>
                    <Link href="/#tools" className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">Tools</Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-[var(--foreground-secondary)] hover:text-white"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-[#0a0a0a] border-b border-white/10 p-4 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-2">
                    <Link href="/" onClick={closeMenu} className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors py-2">Product</Link>
                    <Link href="/vibeMarket" onClick={closeMenu} className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors py-2">VibeMarket</Link>
                    <Link href="/scan" onClick={closeMenu} className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors py-2">Scan</Link>
                    <Link href="/memory" onClick={closeMenu} className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors py-2">Memory</Link>
                    <Link href="/skills" onClick={closeMenu} className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors py-2">Skills</Link>
                    <Link href="/brain" onClick={closeMenu} className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors py-2">Brain</Link>
                    <Link href="/predictions" onClick={closeMenu} className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors py-2">Predictions</Link>
                    <Link href="/#tools" onClick={closeMenu} className="text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors py-2">Tools</Link>
                </div>
            )}
        </nav>
    );
}
