"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Brain,
    ArrowLeft,
    ZoomIn,
    ZoomOut,
    Maximize2,
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { memoryStore } from "@/lib/memoryStore";
import { Memory } from "@/lib/memoryTypes";

interface Node {
    id: string;
    title: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    tags: string[];
    source: string;
    connections: number;
}

interface Edge {
    source: string;
    target: string;
    weight: number;
}

export default function MemoryGraphPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [zoom, setZoom] = useState(1);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    // Load memories and calculate graph
    const loadGraph = useCallback(async () => {
        setLoading(true);
        try {
            const data = await memoryStore.getAll();
            setMemories(data);

            // Create nodes
            const newNodes: Node[] = data.map((m, i) => ({
                id: m.id,
                title: m.title.slice(0, 30) + (m.title.length > 30 ? '...' : ''),
                x: 300 + Math.cos(i * 0.5) * 200 + Math.random() * 100,
                y: 300 + Math.sin(i * 0.5) * 200 + Math.random() * 100,
                vx: 0,
                vy: 0,
                tags: m.tags,
                source: m.source,
                connections: 0
            }));

            // Calculate edges based on shared tags
            const newEdges: Edge[] = [];
            for (let i = 0; i < data.length; i++) {
                for (let j = i + 1; j < data.length; j++) {
                    const sharedTags = data[i].tags.filter(t => data[j].tags.includes(t));

                    // Also check content similarity (simple word overlap)
                    const words1 = new Set(data[i].content.toLowerCase().split(/\s+/).filter(w => w.length > 4));
                    const words2 = new Set(data[j].content.toLowerCase().split(/\s+/).filter(w => w.length > 4));
                    const sharedWords = [...words1].filter(w => words2.has(w)).length;

                    const weight = sharedTags.length * 2 + Math.min(sharedWords / 10, 3);

                    if (weight > 0.5) {
                        newEdges.push({
                            source: data[i].id,
                            target: data[j].id,
                            weight: Math.min(weight, 5)
                        });
                        newNodes[i].connections++;
                        newNodes[j].connections++;
                    }
                }
            }

            setNodes(newNodes);
            setEdges(newEdges);
        } catch (error) {
            console.error("Failed to load graph:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    // Force-directed layout simulation
    useEffect(() => {
        if (nodes.length === 0) return;

        const simulate = () => {
            setNodes(prevNodes => {
                const newNodes = [...prevNodes];

                // Apply forces
                for (let i = 0; i < newNodes.length; i++) {
                    // Repulsion between all nodes
                    for (let j = i + 1; j < newNodes.length; j++) {
                        const dx = newNodes[j].x - newNodes[i].x;
                        const dy = newNodes[j].y - newNodes[i].y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = 500 / (dist * dist);

                        newNodes[i].vx -= (dx / dist) * force;
                        newNodes[i].vy -= (dy / dist) * force;
                        newNodes[j].vx += (dx / dist) * force;
                        newNodes[j].vy += (dy / dist) * force;
                    }

                    // Center gravity
                    newNodes[i].vx += (400 - newNodes[i].x) * 0.01;
                    newNodes[i].vy += (300 - newNodes[i].y) * 0.01;
                }

                // Apply edge attractions
                edges.forEach(edge => {
                    const source = newNodes.find(n => n.id === edge.source);
                    const target = newNodes.find(n => n.id === edge.target);
                    if (!source || !target) return;

                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 100) * 0.02 * edge.weight;

                    source.vx += (dx / dist) * force;
                    source.vy += (dy / dist) * force;
                    target.vx -= (dx / dist) * force;
                    target.vy -= (dy / dist) * force;
                });

                // Update positions with damping
                newNodes.forEach(node => {
                    node.vx *= 0.9;
                    node.vy *= 0.9;
                    node.x += node.vx;
                    node.y += node.vy;

                    // Keep in bounds
                    node.x = Math.max(50, Math.min(750, node.x));
                    node.y = Math.max(50, Math.min(550, node.y));
                });

                return newNodes;
            });

            animationRef.current = requestAnimationFrame(simulate);
        };

        animationRef.current = requestAnimationFrame(simulate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [edges, nodes.length]);

    // Draw graph
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.scale(zoom, zoom);

            // Draw edges
            edges.forEach(edge => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (!source || !target) return;

                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + edge.weight * 0.1})`;
                ctx.lineWidth = edge.weight * 0.5;
                ctx.stroke();
            });

            // Draw nodes
            nodes.forEach(node => {
                const size = 8 + node.connections * 2;
                const isSelected = selectedNode?.id === node.id;

                // Node circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
                ctx.fillStyle = isSelected ? '#a855f7' : '#6366f1';
                ctx.fill();

                if (isSelected) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Node label
                ctx.fillStyle = '#fff';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(node.title, node.x, node.y + size + 12);
            });

            ctx.restore();

            requestAnimationFrame(draw);
        };

        draw();
    }, [nodes, edges, selectedNode, zoom]);

    // Handle canvas click
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        // Find clicked node
        const clicked = nodes.find(node => {
            const size = 8 + node.connections * 2;
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) < size;
        });

        setSelectedNode(clicked || null);
    };

    return (
        <div className="min-h-screen py-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/memory"
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Memory Graph</h1>
                                <p className="text-sm text-[var(--foreground-secondary)]">
                                    {nodes.length} memories · {edges.length} connections
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-[var(--foreground-muted)] w-12 text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setZoom(1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={loadGraph}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Graph */}
                <div className="relative rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-[600px]">
                            <div className="text-[var(--foreground-muted)]">Loading graph...</div>
                        </div>
                    ) : nodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[600px]">
                            <Brain className="w-12 h-12 text-[var(--foreground-muted)] mb-4" />
                            <p className="text-[var(--foreground-muted)]">Add some memories to see connections</p>
                        </div>
                    ) : (
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={600}
                            onClick={handleCanvasClick}
                            className="cursor-crosshair w-full"
                        />
                    )}
                </div>

                {/* Selected node info */}
                {selectedNode && (
                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <h3 className="font-semibold text-white mb-2">{selectedNode.title}</h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                                {selectedNode.source}
                            </span>
                            {selectedNode.tags.map(tag => (
                                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                                    {tag}
                                </span>
                            ))}
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                                {selectedNode.connections} connections
                            </span>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6 text-xs text-[var(--foreground-muted)]">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
                        <span>Memory node</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-purple-500/50" />
                        <span>Shared tags/content</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Larger node = more connections</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
