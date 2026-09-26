import * as THREE from 'three'
import { createMemberModel, type MemberAbility } from './memberScenes'

export type Ability = 'pain' | 'tobi' | 'orochimaru' | MemberAbility

export function createAbilityScene(
  canvas: HTMLCanvasElement,
  ability: Ability,
  onArtworkReady?: () => void,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80)
  camera.position.z = 12
  const world = new THREE.Group()
  scene.add(world)
  const pointer = new THREE.Vector2()
  let time = 0
  let power = 0
  let active = false
  let variant = 0
  let motion = true
  let visible = false
  let needsRender = true
  let disposed = false
  let artworkReady = false
  let artworkAnnounced = false
  const textures: THREE.Texture[] = []
  let frame = 0
  let previousTime = performance.now()
  let update: () => void

  scene.add(new THREE.AmbientLight(0xffffff, 2))
  const key = new THREE.DirectionalLight(0xffffff, 4)
  key.position.set(-3, 5, 6)
  scene.add(key)
  const rim = new THREE.PointLight(
    ability === 'pain' ? 0xbda3ef : ability === 'tobi' ? 0xffa85a : 0x67dba7,
    60,
    20,
  )
  rim.position.set(3, -2, 5)
  scene.add(rim)

  if (ability !== 'pain' && ability !== 'tobi' && ability !== 'orochimaru') {
    const updateModel = createMemberModel(world, ability)
    update = () => updateModel(time, power, pointer, variant)
  } else if (ability === 'pain') {
    const rings = Array.from({ length: 6 }, (_, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(
          1.25 + index * 0.47,
          0.021 + index * 0.004,
          8,
          140,
        ),
        new THREE.MeshStandardMaterial({
          color: index % 2 ? 0xb5a0dc : 0xe1d1ff,
          metalness: 0.65,
          roughness: 0.3,
          transparent: true,
          opacity: 0.7,
        }),
      )
      ring.position.z = -index * 0.18
      world.add(ring)
      return ring
    })
    const rubble = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.15, 0),
      new THREE.MeshStandardMaterial({
        color: 0x7c718c,
        metalness: 0.5,
        roughness: 0.65,
      }),
      75,
    )
    const transform = new THREE.Object3D()
    world.add(rubble)
    const shockwave = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.045, 10, 140),
      new THREE.MeshBasicMaterial({
        color: 0xe8d9ff,
        transparent: true,
        opacity: 0,
      }),
    )
    world.add(shockwave)
    update = () => {
      world.rotation.x = 0.12 + pointer.y * 0.1
      world.rotation.y = -0.16 + pointer.x * 0.14
      rings.forEach((ring, index) => {
        ring.scale.setScalar(
          1 + Math.sin(time * 0.9 - index * 0.5) * 0.025 + power * index * 0.12,
        )
        ring.rotation.z = time * 0.03 * (index % 2 ? 1 : -1)
      })
      for (let index = 0; index < 75; index++) {
        const angle = index * 2.39996 + time * 0.035
        const radius = 3.15 + (index % 9) * 0.17 + power * (2 + (index % 3))
        transform.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          Math.sin(index * 17) * 1.2,
        )
        transform.rotation.set(time * 0.25 + index, index * 3.1, time * 0.16)
        transform.scale.setScalar(0.5 + (index % 5) * 0.25)
        transform.updateMatrix()
        rubble.setMatrixAt(index, transform.matrix)
      }
      rubble.instanceMatrix.needsUpdate = true
      shockwave.scale.setScalar(1 + power * 7)
      shockwave.material.opacity = power * 0.7
    }
  } else if (ability === 'tobi') {
    const cutout = new THREE.TextureLoader().load('/cutouts/tobi.webp', () => {
      if (!disposed) {
        artworkReady = true
        needsRender = true
      }
    })
    cutout.colorSpace = THREE.SRGBColorSpace
    textures.push(cutout)
    const uniforms = { uMap: { value: cutout }, uPower: { value: 0 } }
    const silhouette = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 6.5, 70, 100),
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: `
        uniform float uPower;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec2 eye = vec2(-0.3, 2.65);
          vec2 relative = position.xy - eye;
          float distanceToEye = length(relative);
          float twist = uPower * (5.5 - distanceToEye * 0.38);
          mat2 rotation = mat2(cos(twist), -sin(twist), sin(twist), cos(twist));
          float contraction = pow(max(0.004, 1.0 - uPower), 1.0 + distanceToEye * 0.14);
          vec3 warped = vec3(eye + rotation * relative * contraction, -uPower * distanceToEye * 0.6);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(warped, 1.0);
        }
      `,
        fragmentShader: `
        uniform sampler2D uMap;
        uniform float uPower;
        varying vec2 vUv;
        void main() {
          vec4 pixel = texture2D(uMap, vUv);
          if (pixel.a < 0.025) discard;
          gl_FragColor = vec4(pixel.rgb, pixel.a * (1.0 - smoothstep(0.82, 1.0, uPower)));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      }),
    )
    silhouette.position.set(0.2, -0.25, 0)
    scene.add(silhouette)
    world.position.set(-0.1, 2.4, 0.4)
    const spirals = Array.from({ length: 7 }, (_, index) => {
      const points = Array.from({ length: 180 }, (_, step) => {
        const progress = step / 179
        const angle = progress * Math.PI * 3.8 + (index / 7) * Math.PI * 2
        const radius = 0.6 + progress * 3.65
        return new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          -1.8 + progress * 2.3,
        )
      })
      const spiral = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          180,
          index % 2 ? 0.027 : 0.055,
          6,
          false,
        ),
        new THREE.MeshStandardMaterial({
          color: index % 2 ? 0x8f867a : 0xc17a3d,
          metalness: 0.7,
          roughness: 0.3,
          transparent: true,
          opacity: 0.12,
        }),
      )
      world.add(spiral)
      return spiral
    })
    const fragments = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0xdba776,
        metalness: 0.8,
        roughness: 0.3,
      }),
      100,
    )
    const transform = new THREE.Object3D()
    world.add(fragments)
    update = () => {
      uniforms.uPower.value = power
      silhouette.rotation.y = pointer.x * 0.04 * (1 - power)
      world.scale.setScalar(0.14 + power * 0.42)
      world.rotation.set(
        pointer.y * 0.13,
        pointer.x * 0.18,
        -time * 0.12 - power * 1.8,
      )
      spirals.forEach((spiral, index) => {
        spiral.material.opacity = 0.1 + power * 0.75
        spiral.scale.setScalar(1 + power * 0.15)
        spiral.rotation.z = Math.sin(time * 0.4 + index) * 0.035
      })
      for (let index = 0; index < 100; index++) {
        const progress =
          (((index / 100 - time * (0.018 + power * 0.06)) % 1) + 1) % 1
        const angle = progress * 12 + index * 2.399
        const radius = 0.5 + progress * 4
        transform.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          -1 + progress * 2,
        )
        transform.rotation.set(index + time, index, time * 0.2)
        transform.scale.setScalar(progress * 1.7)
        transform.updateMatrix()
        fragments.setMatrixAt(index, transform.matrix)
      }
      fragments.instanceMatrix.needsUpdate = true
    }
  } else {
    const points = Array.from({ length: 120 }, (_, index) => {
      const progress = index / 119
      const angle = progress * Math.PI * 3.2 - 0.65
      const radius = 2.3 - progress * 0.55
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        -2.6 + progress * 5.2,
        Math.sin(angle) * 0.7,
      )
    })
    const curve = new THREE.CatmullRomCurve3(points)
    const geometry = new THREE.TubeGeometry(curve, 200, 0.21, 14, false)
    const scales = new THREE.MeshPhysicalMaterial({
      color: 0xd9e5cd,
      metalness: 0.2,
      roughness: 0.34,
      clearcoat: 0.8,
    })
    scales.onBeforeCompile = (shader) => {
      shader.vertexShader = '#define USE_UV\n' + shader.vertexShader
      shader.fragmentShader = '#define USE_UV\n' + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        vec2 scaleUv = vUv * vec2(130.0, 10.0);
        scaleUv.x += mod(floor(scaleUv.y), 2.0) * 0.5;
        float scaleEdge = smoothstep(0.31, 0.49, length(fract(scaleUv) - 0.5));
        diffuseColor.rgb *= 1.0 - scaleEdge * 0.16;
      `,
      )
    }
    const serpent = new THREE.Group()
    const body = new THREE.Mesh(geometry, scales)
    serpent.add(body)
    const head = new THREE.Group()
    head.position.copy(points[points.length - 1])
    head.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      curve.getTangent(1),
    )
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), scales)
    skull.scale.set(0.8, 1.7, 0.65)
    skull.position.y = 0.15
    head.add(skull)
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.061, 12, 8),
        new THREE.MeshStandardMaterial({
          color: 0xe6b144,
          emissive: 0x5b3704,
          roughness: 0.2,
        }),
      )
      eye.position.set(side * 0.2, 0.35, 0.15)
      head.add(eye)
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.029, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x14231b }),
      )
      pupil.scale.set(0.4, 1.3, 0.4)
      pupil.position.set(side * 0.218, 0.35, 0.19)
      head.add(pupil)
    }
    serpent.add(head)
    world.add(serpent)
    const shed = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x3e8065,
        wireframe: true,
        transparent: true,
        opacity: 0,
      }),
    )
    world.add(shed)
    const seal = new THREE.Mesh(
      new THREE.TorusGeometry(3.7, 0.014, 8, 160),
      new THREE.MeshBasicMaterial({
        color: 0x688d72,
        transparent: true,
        opacity: 0.55,
      }),
    )
    seal.rotation.x = 0.18
    world.add(seal)
    update = () => {
      world.rotation.set(
        pointer.y * 0.1,
        -0.25 + pointer.x * 0.2 + Math.sin(time * 0.3) * 0.18,
        -0.15,
      )
      serpent.position.y = Math.sin(time * 0.8) * 0.15
      serpent.rotation.y = Math.sin(time * 0.5) * 0.2 + power * 0.7
      head.rotation.z = Math.sin(time * 0.9) * 0.08
      shed.position.x = -power * 1.1
      shed.scale.setScalar(1 + power * 0.2)
      shed.material.opacity = power * 0.35
      seal.rotation.z = time * 0.03
    }
  }

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.position.z = camera.aspect < 0.9 ? 15.8 : 12.8
    if (ability === 'tobi') camera.position.z = 10.9
    camera.updateProjectionMatrix()
    update()
    renderer.render(scene, camera)
  }
  const events = new AbortController()
  const section = canvas.closest('section')!
  section.addEventListener(
    'pointermove',
    (event) => {
      if (!motion) return
      const bounds = canvas.getBoundingClientRect()
      pointer.set(
        THREE.MathUtils.clamp(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          -1,
          1,
        ),
        THREE.MathUtils.clamp(
          ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
          -1,
          1,
        ),
      )
    },
    { signal: events.signal },
  )
  section.addEventListener('pointerleave', () => pointer.set(0, 0), {
    signal: events.signal,
  })
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    needsRender = true
  })
  visibilityObserver.observe(canvas)
  const animate = (now: number) => {
    frame = requestAnimationFrame(animate)
    if (!visible || document.hidden) {
      previousTime = now
      return
    }
    if ((!motion && !needsRender) || now - previousTime < 1000 / 30) return
    const delta = Math.min((now - previousTime) / 1000, 0.05)
    previousTime = now
    if (motion) {
      time += delta
      power = THREE.MathUtils.damp(
        power,
        active ? 1 : 0,
        active ? 2.3 : 3.5,
        delta,
      )
    } else {
      power = 0
      pointer.set(0, 0)
    }
    update()
    renderer.render(scene, camera)
    if (artworkReady && !artworkAnnounced) {
      artworkAnnounced = true
      onArtworkReady?.()
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
    setActive(value: boolean) {
      active = value
      needsRender = true
    },
    setVariant(value: number) {
      variant = value
      needsRender = true
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      events.abort()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry)
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(material)
          if (object instanceof THREE.InstancedMesh) object.dispose()
        }
      })
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      textures.forEach((texture) => texture.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
