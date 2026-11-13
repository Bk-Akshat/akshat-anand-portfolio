/* =====================================================
   3D BACKGROUND SCENE (Three.js)

   A "data constellation": a glowing particle sphere with a
   wireframe core, three orbit rings with travelling nodes,
   and a starfield. It sits behind the page, locks onto the
   hero profile card, then drifts across the page as you scroll.
   ===================================================== */

(function () {
    "use strict";

    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;

    // If Three.js failed to load (offline / blocked), the site still works without it
    if (!window.THREE) {
        canvas.remove();
        return;
    }

    const THREE = window.THREE;
    const MU = THREE.MathUtils;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = () => window.innerWidth < 700;


    /* ================= RENDERER ================= */

    let renderer;

    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: "low-power"
        });
    } catch (error) {
        canvas.remove();
        return;
    }

    const DPR = Math.min(window.devicePixelRatio || 1, 1.75);

    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 0);

    canvas.addEventListener("webglcontextlost", event => event.preventDefault());

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 9;

    const rig = new THREE.Group();   // reacts to the mouse
    const core = new THREE.Group();  // moves with scroll
    rig.add(core);
    scene.add(rig);


    /* ================= THEME PALETTE ================= */

    const palette = {
        a: new THREE.Color("#9875ff"),
        b: new THREE.Color("#55c7ef")
    };

    let isDark = true;

    // Materials whose colour/opacity follow the theme
    const themed = [];

    function track(material, key, darkOpacity, lightOpacity) {
        themed.push({ material, key, darkOpacity, lightOpacity });
    }


    /* ================= PARTICLE SPHERE (custom shader) ================= */

    const sphereCount = isSmall() ? 900 : 2000;
    const positions = new Float32Array(sphereCount * 3);
    const randoms = new Float32Array(sphereCount);
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < sphereCount; i++) {

        const y = 1 - (i / (sphereCount - 1)) * 2;
        const ringRadius = Math.sqrt(1 - y * y);
        const theta = golden * i;
        const radius = 2.5 * (0.9 + Math.random() * 0.2);

        positions[i * 3]     = Math.cos(theta) * ringRadius * radius;
        positions[i * 3 + 1] = y * radius;
        positions[i * 3 + 2] = Math.sin(theta) * ringRadius * radius;

        randoms[i] = Math.random();
    }

    const sphereGeometry = new THREE.BufferGeometry();
    sphereGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    sphereGeometry.setAttribute("aRand", new THREE.BufferAttribute(randoms, 1));

    const uniforms = {
        uTime:       { value: 0 },
        uPixelRatio: { value: DPR },
        uSize:       { value: 5.2 },
        uAlpha:      { value: 1 },
        uColorA:     { value: palette.a },
        uColorB:     { value: palette.b }
    };

    const sphereMaterial = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,

        vertexShader: `
            uniform float uTime;
            uniform float uPixelRatio;
            uniform float uSize;
            attribute float aRand;
            varying float vMix;

            void main() {
                vec3 p = position;

                // Gentle breathing wave travelling over the surface
                float wave = sin(p.y * 1.6 + uTime * 0.9 + aRand * 6.2831) * 0.12
                           + sin(p.x * 2.1 - uTime * 0.7) * 0.08;
                p += normalize(position) * wave;

                vMix = clamp(p.y / 5.0 + 0.5, 0.0, 1.0);

                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_PointSize = uSize * uPixelRatio * (0.6 + aRand * 0.9) * (9.0 / -mv.z);
                gl_Position = projectionMatrix * mv;
            }
        `,

        fragmentShader: `
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            uniform float uAlpha;
            varying float vMix;

            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;

                float soft = smoothstep(0.5, 0.0, d);
                gl_FragColor = vec4(mix(uColorA, uColorB, vMix), soft * uAlpha);
            }
        `
    });

    core.add(new THREE.Points(sphereGeometry, sphereMaterial));


    /* ================= WIREFRAME CORE ================= */

    const shell = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.8, 1)),
        new THREE.LineBasicMaterial({ transparent: true, depthWrite: false })
    );
    track(shell.material, "a", 0.26, 0.32);
    core.add(shell);

    const inner = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.35, 0)),
        new THREE.LineBasicMaterial({ transparent: true, depthWrite: false })
    );
    track(inner.material, "b", 0.55, 0.7);
    core.add(inner);


    /* ================= ORBIT RINGS + NODES ================= */

    const orbitDefs = [
        { radius: 3.6, tiltX:  1.15, tiltY: 0.15, speed:  0.32, key: "a" },
        { radius: 4.3, tiltX:  0.35, tiltY: 0.95, speed: -0.24, key: "b" },
        { radius: 5.1, tiltX: -0.75, tiltY: 0.45, speed:  0.17, key: "a" }
    ];

    const orbits = [];

    orbitDefs.forEach(def => {

        const pivot = new THREE.Group();
        pivot.rotation.set(def.tiltX, def.tiltY, 0);

        const ringMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
        track(ringMaterial, def.key, 0.42, 0.5);

        pivot.add(new THREE.Mesh(
            new THREE.TorusGeometry(def.radius, 0.012, 6, 220),
            ringMaterial
        ));

        const spin = new THREE.Group();
        pivot.add(spin);

        const nodeMaterial = new THREE.MeshBasicMaterial({ transparent: true });
        track(nodeMaterial, def.key, 0.95, 1);

        const nodeGeometry = new THREE.OctahedronGeometry(0.15, 0);

        [0, Math.PI].forEach(angle => {
            const arm = new THREE.Group();
            arm.rotation.z = angle;

            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            node.position.x = def.radius;

            arm.add(node);
            spin.add(arm);
        });

        core.add(pivot);
        orbits.push({ spin, speed: def.speed });
    });


    /* ================= STARFIELD ================= */

    const starCount = isSmall() ? 350 : 800;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3]     = (Math.random() - 0.5) * 44;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 28;
        starPositions[i * 3 + 2] = -12 + Math.random() * 16;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);


    /* ================= THEME HANDLING ================= */

    function applyTheme() {

        isDark = document.documentElement.getAttribute("data-theme") !== "light";

        // Slightly deeper colours on a light background so the scene stays visible
        palette.a.set(isDark ? "#9875ff" : "#6a43e0");
        palette.b.set(isDark ? "#55c7ef" : "#0f86b8");

        // Additive glow looks great on dark, but disappears on light
        const blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

        sphereMaterial.blending = blending;
        sphereMaterial.needsUpdate = true;

        starMaterial.blending = blending;
        starMaterial.color.set(isDark ? "#c9d1ff" : "#5a60a0");
        starMaterial.needsUpdate = true;

        themed.forEach(item => item.material.color.copy(palette[item.key]));

        if (reduceMotion) update(2);
    }

    new MutationObserver(applyTheme).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
    });


    /* ================= LAYOUT ================= */

    let viewW = 0;
    let viewH = 0;
    let lastW = 0;
    let lastH = 0;

    // World-space size of the visible area at z = 0
    let worldH = 1;
    let worldW = 1;

    // Page-space centre of the hero profile card (the 3D object locks onto it)
    let anchorX = window.innerWidth * 0.7;
    let anchorY = window.innerHeight * 0.5;

    function measureAnchor() {

        const visual = document.querySelector(".hero-visual");
        if (!visual) return;

        const rect = visual.getBoundingClientRect();

        anchorX = rect.left + rect.width / 2 + window.scrollX;
        anchorY = rect.top + rect.height / 2 + window.scrollY;
    }

    function resize(force) {

        const w = window.innerWidth;
        const h = window.innerHeight;

        // Ignore small height changes (mobile address bar showing/hiding)
        if (!force && w === lastW && Math.abs(h - lastH) < 120) return;

        lastW = w;
        lastH = h;
        viewW = w;
        viewH = h;

        renderer.setSize(w, h, false);

        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        worldH = 2 * camera.position.z * Math.tan(MU.degToRad(camera.fov / 2));
        worldW = worldH * camera.aspect;

        measureAnchor();

        if (reduceMotion) update(2);
    }

    window.addEventListener("resize", () => resize(false));
    window.addEventListener("load", () => {
        measureAnchor();
        setTimeout(measureAnchor, 1200); // after fonts and icons settle
    });


    /* ================= POINTER ================= */

    const mouse = { x: 0, y: 0, cx: 0, cy: 0 };

    window.addEventListener("pointermove", event => {

        if (event.pointerType === "touch") return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (event.clientY / window.innerHeight) * 2 - 1;

    }, { passive: true });


    /* ================= FRAME UPDATE ================= */

    function update(time) {

        const scrollY = window.scrollY || 0;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewH);
        const progress = MU.clamp(scrollY / maxScroll, 0, 1);

        // 1 while the hero is on screen, 0 once scrolled past it
        const heroAmount = MU.clamp(1 - scrollY / (viewH * 0.85), 0, 1);
        const eased = heroAmount * heroAmount * (3 - 2 * heroAmount);

        // Mouse parallax on the whole rig
        mouse.cx += (mouse.x - mouse.cx) * 0.05;
        mouse.cy += (mouse.y - mouse.cy) * 0.05;

        rig.rotation.y = mouse.cx * 0.22;
        rig.rotation.x = mouse.cy * 0.14;

        // Hero: sit behind the profile card. Later: roam the page as you scroll.
        const heroX = ((anchorX / viewW) * 2 - 1) * worldW / 2;
        const heroY = -(((anchorY - scrollY) / viewH) * 2 - 1) * worldH / 2;

        const roamAmp = isSmall() ? 1.2 : 4.0;
        const roamX = Math.sin(progress * Math.PI * 4 + 0.6) * roamAmp;
        const roamY = Math.cos(progress * Math.PI * 3) * 1.1;

        core.position.set(
            MU.lerp(roamX, heroX, eased),
            MU.lerp(roamY, heroY, eased),
            MU.lerp(-2, 0, eased)
        );

        const heroScale = MU.clamp(viewW / 1500, 0.5, 1.1);
        core.scale.setScalar(MU.lerp(heroScale * 0.8, heroScale, eased));

        // Spin: constant motion plus extra turn from scrolling
        core.rotation.y = time * 0.1 + scrollY * 0.0012;
        core.rotation.x = Math.sin(time * 0.2) * 0.15;

        inner.rotation.y = -time * 0.35;
        inner.rotation.x = time * 0.2;
        shell.rotation.y = time * 0.05;

        orbits.forEach(orbit => {
            orbit.spin.rotation.z = time * orbit.speed;
        });

        // Starfield drifts slower than the page (depth)
        stars.position.y = scrollY * 0.0016;
        stars.rotation.y = time * 0.012;

        // Fade a little once it is behind page content
        const fade = MU.lerp(0.45, 1, eased);

        uniforms.uTime.value = time;
        uniforms.uAlpha.value = (isDark ? 1 : 0.9) * fade;

        starMaterial.opacity = (isDark ? 0.6 : 0.5) * MU.lerp(0.6, 1, eased);

        themed.forEach(item => {
            item.material.opacity = (isDark ? item.darkOpacity : item.lightOpacity) * fade;
        });

        renderer.render(scene, camera);
    }


    /* ================= RENDER LOOP ================= */

    let frameId = 0;
    let revealed = false;

    function loop(now) {
        frameId = requestAnimationFrame(loop);
        update(now / 1000);

        if (!revealed) {
            revealed = true;
            canvas.classList.add("ready");
        }
    }

    function start() {
        if (!frameId) frameId = requestAnimationFrame(loop);
    }

    function stop() {
        cancelAnimationFrame(frameId);
        frameId = 0;
    }

    // Pause when the tab is hidden to save battery
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else if (!reduceMotion) start();
    });

    applyTheme();
    resize(true);

    if (reduceMotion) {

        // Respect "reduce motion": draw a still frame, redraw only on scroll
        update(2);
        canvas.classList.add("ready");

        let ticking = false;

        window.addEventListener("scroll", () => {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                update(2);
                ticking = false;
            });
        }, { passive: true });

    } else {
        start();
    }

})();
