"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const DOT_CATEGORIES = [
    { label: 'Positive', color: '#10B981', hex: 0x10B981 },
    { label: 'Negative', color: '#EF4444', hex: 0xEF4444 },
    { label: 'Neutral', color: '#4F46E5', hex: 0x4F46E5 },
    { label: 'Mixed', color: '#F59E0B', hex: 0xF59E0B },
];

const LIVE_STATS = [
    { value: '2.4M+', label: 'Texts Analyzed', color: '#10B981' },
    { value: '94ms', label: 'Avg Response', color: '#4F46E5' },
    { value: '99.2%', label: 'Accuracy Rate', color: '#F59E0B' },
];

export default function GlobeSection() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (window.innerWidth < 768) return;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

        const scene = new THREE.Scene();

        // Camera positioned back enough so NOTHING clips
        const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 3.2);

        const group = new THREE.Group();
        // Give the earth a natural axial tilt (Earth is 23.5 degrees)
        group.rotation.x = 0.41;
        group.rotation.z = -0.15;
        scene.add(group);

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');

        // ── 1. Perfect Real-World Day Globe ─────────────────────────────────
        // We use the day map ("atmos") so it looks like a real, visible globe.
        // We add normal (bump) and specular (reflection) maps for high-end realism.
        const earthMat = new THREE.MeshPhongMaterial({
            map: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
            specularMap: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
            normalMap: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'),
            color: 0xe0e6ff, // Slight cool moonlight tint to blend with dark mode
            specular: new THREE.Color(0x333333),
            shininess: 15,
        });
        const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat);
        group.add(earth);

        // ── 2. Clouds Layer (for depth and realism) ──────────────────────────
        const cloudMat = new THREE.MeshPhongMaterial({
            map: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
            transparent: true,
            opacity: 0.6, // Much more visible clouds
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.008, 64, 64), cloudMat);
        group.add(clouds);

        // (We removed the 3D "Halo" sphere because it was causing the ugly straight-edge clipping!)

        // ── 3. Sentiment Signal Dots ─────────────────────────────────────────
        const pointGeo = new THREE.SphereGeometry(0.015, 16, 16);
        const dataPoints: { mesh: THREE.Mesh; phase: number; speed: number }[] = [];

        for (let i = 0; i < 70; i++) {
            const cat = DOT_CATEGORIES[Math.floor(Math.random() * DOT_CATEGORIES.length)];
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;

            const mesh = new THREE.Mesh(pointGeo, new THREE.MeshBasicMaterial({
                color: cat.hex,
                transparent: true,
                opacity: 0.95
            }));

            mesh.position.set(
                Math.sin(phi) * Math.cos(theta) * 1.015,
                Math.cos(phi) * 1.015,
                Math.sin(phi) * Math.sin(theta) * 1.015,
            );
            group.add(mesh);
            dataPoints.push({ mesh, phase: Math.random() * Math.PI * 2, speed: 1.5 + Math.random() });
        }

        // ── 4. High-Visibility Lighting ──────────────────────────────────────
        // Make the ambient light strong enough so the globe isn't "dark"
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));

        // A strong main light to show off the oceans and continents
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 3, 5);
        scene.add(dirLight);

        // A secondary rim light to give the sphere 3D depth in the shadows
        const backLight = new THREE.DirectionalLight(0x4F46E5, 0.8);
        backLight.position.set(-5, -3, -5);
        scene.add(backLight);

        let running = true;
        const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; });
        io.observe(canvas);

        let t = 0, animId: number;
        function animate() {
            animId = requestAnimationFrame(animate);
            if (!running) return;
            t += 0.01;

            // Core rotation
            group.rotation.y += 0.0015;

            // Clouds rotate slightly faster for a 3D parallax effect
            clouds.rotation.y += 0.0004;

            // Pulse the sentiment dots
            dataPoints.forEach(dp => {
                const s = 1 + Math.sin(t * dp.speed + dp.phase) * 0.6;
                dp.mesh.scale.setScalar(s);
            });

            renderer.render(scene, camera);
        }
        animate();

        const onResize = () => {
            if (!canvas) return;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        return () => {
            running = false;
            cancelAnimationFrame(animId);
            io.disconnect();
            window.removeEventListener('resize', onResize);
            renderer.dispose();
        };
    }, []);

    return (
        <section className="relative z-20 border-t border-[var(--border)] bg-[#080810] overflow-hidden">
            <div className="max-w-7xl mx-auto px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* ── Left Column: Content ───────────────────────────────── */}
                <div>
                    <span className="inline-block font-mono text-[10px] tracking-[3px] uppercase text-[var(--indigo)] mb-6 px-4 py-1.5 rounded-full"
                        style={{ background: '#4F46E510', border: '1px solid #4F46E530' }}>
                        [ GLOBAL DATA PROTOCOL ]
                    </span>

                    <h2 className="font-mono text-4xl font-bold leading-tight mb-6">
                        Real-time intelligence.<br />
                        <span style={{ color: 'var(--indigo)' }}>Worldwide scale.</span>
                    </h2>

                    <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed mb-10 max-w-md">
                        PULSE_ maps the underlying emotional currents of the global internet.
                        Every data point clusters by region, sentiment flow, and intent.
                    </p>

                    <div className="mb-10">
                        <div className="font-mono text-[9px] tracking-[3px] uppercase text-[var(--text-dim)] mb-4">Signal Categories</div>
                        <div className="grid grid-cols-2 gap-3">
                            {DOT_CATEGORIES.map(({ label, color }) => (
                                <div key={label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                                    <span className="w-2 h-2 rounded-full animate-pulse"
                                        style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                                    <span className="font-mono text-[11px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {LIVE_STATS.map(({ value, label, color }) => (
                            <div key={label} className="px-4 py-4 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
                                <div className="font-mono text-[20px] font-bold" style={{ color }}>{value}</div>
                                <div className="font-mono text-[8px] tracking-[1px] uppercase text-[var(--text-dim)] mt-1">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right Column: The 3D Canvas ───────────────────────── */}
                <div className="relative flex items-center justify-center min-h-[500px] w-full lg:h-[600px]">
                    {/* HTML-based halo (No clipping issues!) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none rounded-full blur-[100px] opacity-40"
                        style={{ background: 'var(--indigo)' }} />

                    {/* The Canvas - set to full size and camera backed up to prevent clipping */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                        style={{ outline: 'none' }}
                    />

                    {/* Dashboard Tags */}
                    <div className="absolute top-6 right-2 sm:right-6 lg:right-0">
                        <div className="px-4 py-2 rounded-xl border border-[var(--indigo)] bg-[rgba(79,70,229,0.1)] backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                                <span className="font-mono text-[10px] text-white font-bold">LIVE FEED ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-2 sm:left-6 lg:left-0 max-w-[200px] p-4 rounded-2xl border border-[var(--border)] bg-[rgba(14,14,26,0.8)] backdrop-blur-xl">
                        <div className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest mb-2">Observation</div>
                        <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                            Increased <span className="text-[var(--positive)] font-bold">Positive Sentiment</span> clusters detected across major hubs.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
