import * as THREE from 'three'

export function createCloudScene(
  canvas: HTMLCanvasElement,
  reducedMotion: boolean,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
  camera.position.set(0, 0.1, 18)
  const sculpture = new THREE.Group()
  scene.add(sculpture)

  const shape = new THREE.Shape()
  shape.moveTo(-2.7, -0.7)
  shape.bezierCurveTo(-4.2, -0.6, -4.15, -2.05, -2.55, -2.05)
  shape.lineTo(1.95, -2.05)
  shape.bezierCurveTo(3.4, -2.05, 3.95, -1.25, 3.2, -0.5)
  shape.bezierCurveTo(4.45, 0.4, 3.25, 2.2, 1.85, 1.3)
  shape.bezierCurveTo(1.55, 3.15, -1.35, 3.2, -1.75, 1.45)
  shape.bezierCurveTo(-3.55, 2.25, -4.6, 0.25, -3.15, -0.05)
  shape.bezierCurveTo(-1.65, -0.05, -1.85, -0.75, -2.7, -0.7)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.48,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.1,
    bevelThickness: 0.12,
    curveSegments: 48,
  })
  geometry.center()
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xcf1724,
    metalness: 0.38,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
  })
  const cloud = new THREE.Mesh(geometry, material)
  sculpture.add(cloud)

  const outline = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xf4ddd3,
      metalness: 0.55,
      roughness: 0.32,
    }),
  )
  outline.scale.set(1.038, 1.058, 0.9)
  outline.position.z = -0.13
  sculpture.add(outline)
  const shadowCloud = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x240608,
      metalness: 0.7,
      roughness: 0.45,
    }),
  )
  shadowCloud.position.set(0.12, -0.1, -0.55)
  sculpture.add(shadowCloud)

  const orbit = new THREE.Group()
  scene.add(orbit)
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x9c8177,
    metalness: 0.8,
    roughness: 0.35,
    transparent: true,
    opacity: 0.42,
  })
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5.05, 0.013, 8, 180),
    ringMaterial,
  )
  ring.rotation.set(0.46, -0.4, 0.1)
  orbit.add(ring)
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.7, 0.008, 8, 160, Math.PI * 1.35),
    ringMaterial,
  )
  innerRing.rotation.set(-0.3, 0.7, 0.7)
  orbit.add(innerRing)
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(5.05, 0.025, 8, 36, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xe44135 }),
  )
  arc.rotation.copy(ring.rotation)
  orbit.add(arc)

  const shardGeometry = new THREE.OctahedronGeometry(0.12, 0)
  const shards = Array.from({ length: 24 }, (_, index) => {
    const shard = new THREE.Mesh(
      shardGeometry,
      new THREE.MeshStandardMaterial({
        color: index % 3 === 0 ? 0xcd302b : 0x625953,
        metalness: 0.7,
        roughness: 0.32,
      }),
    )
    const angle = index * 2.399
    const radius = 4.2 + (index % 4) * 0.32
    shard.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.75,
      Math.sin(index * 3) * 2,
    )
    shard.scale.set(0.45, 2 + (index % 4), 0.35)
    shard.rotation.set(index, index * 2, angle)
    scene.add(shard)
    return shard
  })

  const particleCount = 110
  const positions = new Float32Array(particleCount * 3)
  for (let index = 0; index < particleCount; index++) {
    positions[index * 3] = Math.sin(index * 127.1) * 8
    positions[index * 3 + 1] = Math.cos(index * 311.7) * 6
    positions[index * 3 + 2] = Math.sin(index * 73.3) * 4 - 2
  }
  const particlesGeometry = new THREE.BufferGeometry()
  particlesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3),
  )
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({
      color: 0xcb9d8b,
      size: 0.021,
      transparent: true,
      opacity: 0.55,
    }),
  )
  scene.add(particles)
  scene.add(new THREE.AmbientLight(0xb09c92, 2.4))
  const key = new THREE.DirectionalLight(0xffe8db, 3.3)
  key.position.set(-3, 5, 7)
  scene.add(key)
  const rim = new THREE.PointLight(0xff3325, 85, 25)
  rim.position.set(5, -1, 3)
  scene.add(rim)
  const fill = new THREE.DirectionalLight(0x82949b, 2)
  fill.position.set(-5, -3, 2)
  scene.add(fill)

  const pointer = new THREE.Vector2()
  let autoRotate = !reducedMotion
  let motionEnabled = !reducedMotion
  let visible = true
  let frame = 0
  let pulse = 0
  let dragging = false
  let dragRotation = 0
  let previousPointer = 0
  let time = 0
  let previousTime = performance.now()

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.position.z = camera.aspect < 1 ? 21 : 17.8
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  })
  visibilityObserver.observe(canvas)
  const events = new AbortController()
  canvas.addEventListener(
    'pointermove',
    (event) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      )
      if (dragging && motionEnabled)
        dragRotation += (event.clientX - previousPointer) * 0.008
      previousPointer = event.clientX
    },
    { signal: events.signal },
  )
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'touch') return
      dragging = true
      previousPointer = event.clientX
      canvas.setPointerCapture(event.pointerId)
      if (motionEnabled) pulse = 1
    },
    { signal: events.signal },
  )
  canvas.addEventListener(
    'pointerup',
    () => {
      dragging = false
    },
    { signal: events.signal },
  )
  canvas.addEventListener(
    'pointercancel',
    () => {
      dragging = false
    },
    { signal: events.signal },
  )
  canvas.addEventListener(
    'pointerleave',
    () => {
      pointer.set(0, 0)
    },
    { signal: events.signal },
  )

  const animate = (now: number) => {
    frame = requestAnimationFrame(animate)
    const delta = Math.min((now - previousTime) / 1000, 0.05)
    previousTime = now
    if (!visible || document.hidden) return
    if (motionEnabled) time += delta
    const targetX = motionEnabled ? -0.13 + pointer.y * 0.13 : -0.13
    const targetY = motionEnabled
      ? -0.3 +
        pointer.x * 0.24 +
        dragRotation +
        (autoRotate ? Math.sin(time * 0.32) * 0.2 : 0)
      : -0.3
    sculpture.rotation.x = THREE.MathUtils.lerp(
      sculpture.rotation.x,
      targetX,
      0.05,
    )
    sculpture.rotation.y = THREE.MathUtils.lerp(
      sculpture.rotation.y,
      targetY,
      0.05,
    )
    sculpture.rotation.z =
      -0.13 + (motionEnabled ? Math.sin(time * 0.4) * 0.035 : 0)
    sculpture.position.y = motionEnabled ? Math.sin(time * 0.7) * 0.14 : 0
    pulse = Math.max(0, pulse - delta * 1.4)
    sculpture.scale.setScalar(1 + Math.sin(pulse * Math.PI) * 0.055)
    orbit.rotation.z = time * 0.035
    particles.rotation.z = time * 0.008
    shards.forEach((shard, index) => {
      shard.rotation.y = index + time * 0.12
    })
    renderer.render(scene, camera)
  }
  resize()
  frame = requestAnimationFrame(animate)
  return {
    setMotion(enabled: boolean) {
      motionEnabled = enabled
      autoRotate = enabled
    },
    toggleRotation() {
      autoRotate = !autoRotate
      return autoRotate
    },
    dispose() {
      cancelAnimationFrame(frame)
      events.abort()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          materials.forEach((item: THREE.Material) => item.dispose())
        }
      })
      renderer.dispose()
    },
  }
}
