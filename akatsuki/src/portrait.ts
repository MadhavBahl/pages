import * as THREE from 'three'

export function createPortraitScene(
  canvas: HTMLCanvasElement,
  reducedMotion: boolean,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.setClearColor(0x100e0e, 0)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.z = 9
  const geometry = new THREE.PlaneGeometry(9, 6.75, 100, 75).toNonIndexed()
  const positions = geometry.getAttribute('position')
  const centers = new Float32Array(positions.count * 3)
  const seeds = new Float32Array(positions.count)
  for (let index = 0; index < positions.count; index += 3) {
    const center = new THREE.Vector3()
    for (let corner = 0; corner < 3; corner++)
      center.add(
        new THREE.Vector3().fromBufferAttribute(positions, index + corner),
      )
    center.divideScalar(3)
    for (let corner = 0; corner < 3; corner++) {
      center.toArray(centers, (index + corner) * 3)
      seeds[index + corner] =
        (((Math.sin(index * 12.9898) * 43758.5453) % 1) + 1) % 1
    }
  }
  geometry.setAttribute('aCenter', new THREE.BufferAttribute(centers, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  let disposed = false
  const texture = new THREE.TextureLoader().load('/itachi.webp', () => {
    if (!disposed) canvas.parentElement?.classList.add('portrait-ready')
  })
  texture.colorSpace = THREE.SRGBColorSpace
  const uniforms = {
    uTexture: { value: texture },
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(100, 100) },
    uCapture: { value: 0 },
    uMotion: { value: reducedMotion ? 0 : 1 },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    transparent: true,
    vertexShader: `
      attribute vec3 aCenter;
      attribute float aSeed;
      uniform float uTime;
      uniform float uCapture;
      uniform float uMotion;
      uniform vec2 uPointer;
      varying vec2 vUv;
      varying float vLight;
      void main() {
        vUv = uv;
        float influence = exp(-distance(aCenter.xy, uPointer) * 2.5) * uMotion;
        float fracture = influence * 0.7 + uCapture * (0.35 + aSeed);
        vec3 localPosition = position - aCenter;
        float angle = fracture * (aSeed - 0.5) * 6.0;
        localPosition.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * localPosition.xz;
        vec3 displaced = aCenter + localPosition;
        displaced.x += sin(aSeed * 65.0) * fracture * 1.5;
        displaced.y += cos(aSeed * 39.0) * fracture * 1.4;
        displaced.z += fracture * (0.5 + aSeed * 2.0);
        displaced.z += sin(aCenter.x * 1.2 + uTime * 0.6) * 0.035 * uMotion;
        vLight = 1.0 + fracture * (aSeed - 0.5) * 0.8;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec2 vUv;
      varying float vLight;
      void main() {
        vec3 color = texture2D(uTexture, vUv).rgb;
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(color, vec3(luminance), 0.8);
        color *= vec3(1.0, 0.78, 0.76) * vLight;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  const portrait = new THREE.Mesh(geometry, material)
  scene.add(portrait)
  let visible = false
  let motionEnabled = !reducedMotion
  let captured = false
  let frame = 0
  let previousTime = performance.now()
  const section = canvas.closest('section')!
  const resize = () => {
    const bounds = canvas.getBoundingClientRect()
    renderer.setSize(bounds.width, bounds.height, false)
    camera.aspect = bounds.width / Math.max(bounds.height, 1)
    camera.updateProjectionMatrix()
    const viewHeight =
      2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    portrait.scale.setScalar(
      Math.max(viewHeight / 6.75, (viewHeight * camera.aspect) / 9),
    )
    renderer.render(scene, camera)
  }
  const movePointer = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    const viewHeight =
      2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    uniforms.uPointer.value.set(
      (((event.clientX - bounds.left) / bounds.width - 0.5) *
        viewHeight *
        camera.aspect) /
        portrait.scale.x,
      ((0.5 - (event.clientY - bounds.top) / bounds.height) * viewHeight) /
        portrait.scale.x,
    )
  }
  const leavePointer = () => {
    uniforms.uPointer.value.set(100, 100)
  }
  section.addEventListener('pointermove', movePointer)
  section.addEventListener('pointerleave', leavePointer)
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  })
  visibilityObserver.observe(canvas)
  const animate = (now: number) => {
    frame = requestAnimationFrame(animate)
    const delta = Math.min((now - previousTime) / 1000, 0.05)
    previousTime = now
    if (!visible || document.hidden) return
    if (motionEnabled) uniforms.uTime.value += delta
    uniforms.uCapture.value = THREE.MathUtils.lerp(
      uniforms.uCapture.value,
      captured && motionEnabled ? 1 : 0,
      0.055,
    )
    renderer.render(scene, camera)
  }
  resize()
  frame = requestAnimationFrame(animate)
  return {
    setCaptured(value: boolean) {
      captured = value
    },
    setMotion(value: boolean) {
      motionEnabled = value
      uniforms.uMotion.value = value ? 1 : 0
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      section.removeEventListener('pointermove', movePointer)
      section.removeEventListener('pointerleave', leavePointer)
      canvas.parentElement?.classList.remove('portrait-ready')
      geometry.dispose()
      material.dispose()
      texture.dispose()
      renderer.dispose()
    },
  }
}
