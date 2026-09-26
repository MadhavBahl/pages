import * as THREE from 'three'

export const assemblyMembers = [
  { id: 'kisame', name: 'Kisame', x: -4.3, depth: -1.8, height: 5.5 },
  { id: 'konan', name: 'Konan', x: -2.25, depth: -0.8, height: 5.1 },
  { id: 'tobi', name: 'Obito', x: 4.2, depth: -1.7, height: 5.6 },
  { id: 'pain', name: 'Pain', x: 2.1, depth: -0.7, height: 5.5 },
  { id: 'itachi', name: 'Itachi', x: 0, depth: 0.45, height: 5.8 },
] as const

export function createAssemblyScene(
  canvas: HTMLCanvasElement,
  onReady: () => void,
  onError: () => void,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80)
  camera.position.set(0, 0.8, 16)
  const assembly = new THREE.Group()
  scene.add(assembly)
  const loader = new THREE.TextureLoader()
  let disposed = false
  let loaded = 0
  let announcedReady = false
  let motion = true
  let visible = true
  let selected = 'itachi'
  let needsRender = true
  let frame = 0
  let time = 0
  let arrival = 0
  let previousTime = performance.now()
  let compact = false
  const pointer = new THREE.Vector2()
  const figures = assemblyMembers.map((member, index) => {
    const texture = loader.load(
      `/cutouts/${member.id}.webp`,
      () => {
        if (disposed) return
        const image = texture.image as HTMLImageElement
        figure.scale.x = (member.height * image.width) / image.height
        reflection.scale.x = figure.scale.x
        loaded++
        needsRender = true
      },
      undefined,
      () => {
        if (!disposed) onError()
      },
    )
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    const surface = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.025,
      side: THREE.DoubleSide,
    })
    const figure = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 12, 20),
      surface,
    )
    figure.scale.set(member.height * 0.6, member.height, 1)
    figure.renderOrder = index + 5
    assembly.add(figure)
    const reflection = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
        color: 0x7b8b88,
      }),
    )
    reflection.scale.set(figure.scale.x, -member.height * 0.2, 1)
    assembly.add(reflection)
    return { member, figure, reflection, texture }
  })
  const rainPositions = new Float32Array(200 * 6)
  const rainGeometry = new THREE.BufferGeometry()
  rainGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(rainPositions, 3),
  )
  const rain = new THREE.LineSegments(
    rainGeometry,
    new THREE.LineBasicMaterial({
      color: 0xaabfb9,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  )
  rain.frustumCulled = false
  scene.add(rain)

  const resize = () => {
    const bounds = canvas.getBoundingClientRect()
    renderer.setSize(bounds.width, bounds.height, false)
    camera.aspect = bounds.width / Math.max(bounds.height, 1)
    compact = bounds.width < 760
    const viewHeight = compact
      ? Math.max(7.4, 8.5 / camera.aspect)
      : Math.max(7.6, 12 / camera.aspect)
    camera.position.z =
      viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    camera.position.y = compact ? 0.15 : 0.65
    camera.updateProjectionMatrix()
    needsRender = true
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    needsRender = true
  })
  visibilityObserver.observe(canvas)
  const events = new AbortController()
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (!motion || event.pointerType === 'touch') return
      const bounds = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      )
    },
    { signal: events.signal },
  )
  canvas.addEventListener('pointerleave', () => pointer.set(0, 0), {
    signal: events.signal,
  })

  const animate = (now: number) => {
    frame = requestAnimationFrame(animate)
    if (!visible || document.hidden) {
      previousTime = now
      return
    }
    if ((!motion && !needsRender) || now - previousTime < 1000 / 30) return
    const delta = Math.min((now - previousTime) / 1000, 0.06)
    previousTime = now
    if (motion) {
      time += delta
      arrival = Math.min(1, arrival + delta / 2.4)
    } else {
      arrival = 1
      pointer.set(0, 0)
    }
    const entrance = 1 - Math.pow(1 - arrival, 3)
    assembly.rotation.y = THREE.MathUtils.damp(
      assembly.rotation.y,
      pointer.x * 0.055,
      4,
      delta,
    )
    figures.forEach(({ member, figure, reflection }, index) => {
      const x = compact ? member.x * 0.66 : member.x
      const sway = motion ? Math.sin(time * 1.1 + index * 1.3) * 0.018 : 0
      figure.position.set(
        x - pointer.x * (0.05 + (member.depth + 2) * 0.05),
        -3 + member.height / 2 + sway,
        member.depth - (1 - entrance) * (2.6 + index * 0.25),
      )
      figure.rotation.z = motion ? Math.sin(time * 0.65 + index) * 0.003 : 0
      figure.material.color.setScalar(member.id === selected ? 1 : 0.24)
      figure.material.opacity = 0.2 + entrance * 0.8
      reflection.position.set(
        figure.position.x,
        -3 - member.height * 0.1,
        member.depth,
      )
    })
    for (let index = 0; index < 200; index++) {
      const horizontal = Math.sin(index * 127.1) * 11
      const vertical = 5 - ((index * 0.177 + time * 2.7) % 10)
      const depth = Math.cos(index * 73.3) * 4
      rainPositions.set(
        [
          horizontal,
          vertical,
          depth,
          horizontal - 0.018,
          vertical - 0.13,
          depth,
        ],
        index * 6,
      )
    }
    rainGeometry.getAttribute('position').needsUpdate = true
    renderer.render(scene, camera)
    if (loaded === assemblyMembers.length && !announcedReady) {
      announcedReady = true
      onReady()
    }
    needsRender = false
  }
  resize()
  frame = requestAnimationFrame(animate)
  return {
    setMotion(value: boolean) {
      motion = value
      needsRender = true
    },
    select(value: string) {
      selected = value
      needsRender = true
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      events.abort()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      figures.forEach(({ figure, reflection, texture }) => {
        figure.geometry.dispose()
        figure.material.dispose()
        reflection.geometry.dispose()
        reflection.material.dispose()
        texture.dispose()
      })
      rainGeometry.dispose()
      rain.material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
