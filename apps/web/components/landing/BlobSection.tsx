"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BlobSection() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (window.innerWidth < 768) return; // disable on mobile

        // ── Renderer ────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 4.5);

        // ── Blob geometry (IcosahedronGeometry for smooth morphing) ──
        const geo = new THREE.IcosahedronGeometry(1.4, 5);
        const posAttr = geo.attributes.position;
        // store original positions so we morph from rest shape
        const originalPositions = new Float32Array(posAttr.array.length);
        originalPositions.set(posAttr.array);

        const blobMat = new THREE.MeshPhongMaterial({
            color: 0x0e0e1a,
            shininess: 80,
            specular: new THREE.Color(0x4F46E5).multiplyScalar(0.5),
            transparent: true,
            opacity: 0.92,
        });
        const blob = new THREE.Mesh(geo, blobMat);
        scene.add(blob);

        // ── Wireframe overlay on same geometry ───────────────────────
        const wireGeo = new THREE.IcosahedronGeometry(1.41, 5);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x4F46E5,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
        });
        const wireMesh = new THREE.Mesh(wireGeo, wireMat);
        scene.add(wireMesh);

        // ── Three orbiting point lights ──────────────────────────────
        const light1 = new THREE.PointLight(0x7C3AED, 6, 12); // violet
        const light2 = new THREE.PointLight(0xEF4444, 4, 12); // red
        const light3 = new THREE.PointLight(0x10B981, 4, 12); // green
        scene.add(light1, light2, light3);
        const ambientLight = new THREE.AmbientLight(0x4F46E5, 0.3);
        scene.add(ambientLight);

        // ── IntersectionObserver to pause when off-screen ────────────
        let running = true;
        const io = new IntersectionObserver(([entry]) => {
            running = entry.isIntersecting;
        });
        io.observe(canvas);

        // ── Animation ────────────────────────────────────────────────
        let t = 0;
        let animId: number;

        function animate() {
            animId = requestAnimationFrame(animate);
            if (!running) return;
            t += 0.008;

            // Per-vertex displacement — sine/cosine noise
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const ix = i * 3;
                const ox = originalPositions[ix];
                const oy = originalPositions[ix + 1];
                const oz = originalPositions[ix + 2];

                const noise =
                    Math.sin(ox * 2.5 + t) *
                    Math.cos(oy * 2.5 + t * 0.7) *
                    Math.sin(oz * 2 + t * 0.5);
                const scale = 1 + noise * 0.22;

                pos.setXYZ(i, ox * scale, oy * scale, oz * scale);
            }
            pos.needsUpdate = true;
            geo.computeVertexNormals();

            // Blob rotation
            blob.rotation.y += 0.004;
            blob.rotation.x = Math.sin(t * 0.3) * 0.15;
            wireMesh.rotation.y = blob.rotation.y;
            wireMesh.rotation.x = blob.rotation.x;

            // Orbiting lights
            const r = 2.4;
            light1.position.set(Math.cos(t * 0.8) * r, Math.sin(t * 0.5) * r, Math.sin(t * 0.8) * r);
            light2.position.set(Math.cos(t * 0.8 + 2.09) * r, Math.sin(t * 0.5 + 2.09) * r, Math.sin(t * 0.8 + 2.09) * r);
            light3.position.set(Math.cos(t * 0.8 + 4.18) * r, Math.sin(t * 0.5 + 4.18) * r, Math.sin(t * 0.8 + 4.18) * r);

            renderer.render(scene, camera);
        }
        animate();

        // ── Resize ───────────────────────────────────────────────────
        const onResize = () => {
            if (!canvas) return;
            const w = canvas.clientWidth, h = canvas.clientHeight;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        return () => {
            running = false;
            cancelAnimationFrame(animId);
            io.disconnect();
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            geo.dispose();
            wireGeo.dispose();
        };
    }, []);

    return (
        <section
            className="relative z-20 border-t border-[var(--border)] overflow-hidden"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 50%, #7C3AED06 0%, transparent 70%)' }}
        >
            <div className="max-w-7xl mx-auto px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Left: blob canvas */}
                <div className="relative hidden lg:flex items-center justify-center order-first" style={{ height: 460 }}>
                    {/* Glow ring behind blob */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-80 h-80 rounded-full"
                            style={{ background: 'radial-gradient(circle, #7C3AED18 0%, transparent 70%)' }} />
                    </div>
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        style={{ maxWidth: 460, maxHeight: 460 }}
                    />
                </div>

                {/* Right: copy */}
                <div className="reveal">
                    <span className="section-label">[ DEEP INTELLIGENCE ]</span>
                    <h2 className="text-4xl font-mono font-bold mt-4 leading-tight">
                        Emotion that<br />
                        <span style={{ color: 'var(--violet)' }}>never stops moving.</span>
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed mt-5 max-w-md">
                        Our models don't just classify positive or negative.
                        They resolve six primary emotional vectors — joy, anger, fear, sadness, surprise, disgust —
                        on every piece of text, in under a second.
                    </p>

                    <div className="mt-10 space-y-3">
                        {[
                            { emotion: 'Joy', pct: 82, color: '#10B981' },
                            { emotion: 'Surprise', pct: 61, color: '#F59E0B' },
                            { emotion: 'Sadness', pct: 34, color: '#4A9EDB' },
                            { emotion: 'Anger', pct: 18, color: '#EF4444' },
                        ].map(({ emotion, pct, color }) => (
                            <div key={emotion} className="reveal flex items-center gap-3">
                                <span className="font-mono text-[10px] tracking-wider text-[var(--text-dim)] w-16">{emotion.toUpperCase()}</span>
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
                                    />
                                </div>
                                <span className="font-mono text-[11px] font-bold w-8 text-right" style={{ color }}>{pct}%</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--positive)] animate-pulse" />
                        <span className="font-mono text-[10px] tracking-wider text-[var(--text-dim)]">
                            LIVE EMOTION DETECTION · POWERED BY GEMINI 1.5 FLASH
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
