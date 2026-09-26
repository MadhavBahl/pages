import * as THREE from 'three'

export type MemberAbility =
  | 'konan'
  | 'kisame'
  | 'deidara'
  | 'sasori'
  | 'hidan'
  | 'kakuzu'
  | 'zetsu'
  | 'yahiko'
type Position = [number, number, number]
type AnimateModel = (
  time: number,
  power: number,
  pointer: THREE.Vector2,
  variant: number,
) => void

function material(color: number, roughness = 0.45) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.12,
    side: THREE.DoubleSide,
  })
}

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  surface: THREE.Material,
  position: Position = [0, 0, 0],
  scale: Position = [1, 1, 1],
) {
  const model = new THREE.Mesh(geometry, surface)
  model.position.set(...position)
  model.scale.set(...scale)
  parent.add(model)
  return model
}

function ribbon(
  points: Position[],
  radius: number,
  surface: THREE.Material,
  parent: THREE.Object3D,
) {
  return addMesh(
    parent,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        points.map((point) => new THREE.Vector3(...point)),
      ),
      48,
      radius,
      6,
      false,
    ),
    surface,
  )
}

function featherGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(0.24, 0.35)
  shape.lineTo(0.14, 1.2)
  shape.lineTo(-0.16, 0.95)
  shape.lineTo(-0.2, 0.2)
  shape.closePath()
  const geometry = new THREE.ShapeGeometry(shape)
  const positions = geometry.getAttribute('position')
  for (let index = 0; index < positions.count; index++)
    positions.setZ(index, Math.abs(positions.getX(index)) * 0.65)
  geometry.computeVertexNormals()
  return geometry
}

function paperWings(world: THREE.Group): AnimateModel {
  const paper = material(0xf0f0e8, 0.85)
  const fold = featherGeometry()
  const edges = new THREE.EdgesGeometry(fold)
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x798ea0,
    transparent: true,
    opacity: 0.42,
  })
  const sheets: {
    mesh: THREE.Mesh
    origin: THREE.Vector3
    angle: number
    side: number
  }[] = []
  for (const side of [-1, 1]) {
    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 15; column++) {
        const progress = column / 14
        const sheet = addMesh(
          world,
          fold,
          paper,
          [
            side * (0.3 + progress * 3.3),
            1.8 - row * 0.39 - progress * 1.2,
            row * 0.035,
          ],
          [0.9, 0.75 + progress * 0.65, 1],
        )
        const angle = side * (-0.7 - progress * 0.7)
        sheet.add(new THREE.LineSegments(edges, edgeMaterial))
        sheet.rotation.z = angle
        sheets.push({
          mesh: sheet,
          origin: sheet.position.clone(),
          angle,
          side,
        })
      }
    }
  }
  const flower = new THREE.Group()
  const petal = material(0x829ed7)
  for (let index = 0; index < 8; index++) {
    const piece = addMesh(
      flower,
      fold,
      petal,
      [0, 0, 0.05 * index],
      [0.75, 0.65, 1],
    )
    piece.rotation.z = (index * Math.PI) / 4
  }
  flower.position.set(0, -0.1, 0.6)
  world.add(flower)
  return (time, power, pointer) => {
    world.rotation.set(pointer.y * 0.08, pointer.x * 0.16, 0)
    sheets.forEach(({ mesh, origin, angle, side }, index) => {
      const distance = new THREE.Vector2(origin.x / 4, origin.y / 3).distanceTo(
        new THREE.Vector2(pointer.x, -pointer.y),
      )
      const hover = Math.max(0, 0.38 - distance)
      mesh.position.copy(origin)
      mesh.position.x += side * power * (0.4 + (index % 6) * 0.17)
      mesh.position.y +=
        Math.sin(time * 1.3 + index * 0.7) * (0.025 + power * 0.6)
      mesh.position.z += hover * 2 + power * Math.sin(index * 3) * 2
      mesh.rotation.set(
        power * Math.sin(time + index) * 1.8,
        Math.sin(time * 0.8 + index * 0.07) * 0.1,
        angle + power * ((index % 3) - 1),
      )
    })
    flower.rotation.z = Math.sin(time * 0.35) * 0.12
  }
}

function shark(parent: THREE.Object3D, surface: THREE.Material) {
  const model = new THREE.Group()
  addMesh(
    model,
    new THREE.SphereGeometry(0.25, 16, 10),
    surface,
    [0, 0, 0],
    [2.6, 0.7, 0.8],
  )
  const fin = new THREE.Shape()
  fin.moveTo(-0.3, 0)
  fin.lineTo(-0.12, 0.5)
  fin.lineTo(0.23, 0)
  fin.closePath()
  addMesh(model, new THREE.ShapeGeometry(fin), surface, [-0.07, 0.1, 0])
  const tail = addMesh(
    model,
    new THREE.ConeGeometry(0.3, 0.55, 3),
    surface,
    [-0.64, 0, 0],
    [1, 1, 0.3],
  )
  tail.rotation.z = -Math.PI / 2
  addMesh(
    model,
    new THREE.SphereGeometry(0.03, 8, 6),
    material(0xbdeff1),
    [0.4, 0.07, 0.16],
  )
  parent.add(model)
  return model
}

function samehada(world: THREE.Group): AnimateModel {
  const sword = new THREE.Group()
  const skin = material(0x557187, 0.65)
  const ivory = material(0xe1dfc7, 0.8)
  addMesh(
    sword,
    new THREE.CapsuleGeometry(0.57, 2.65, 8, 16),
    skin,
    [0, 0.55, 0],
  )
  const tooth = new THREE.ConeGeometry(0.17, 0.4, 4)
  for (let row = 0; row < 12; row++) {
    for (let column = 0; column < 8; column++) {
      const angle = (column * Math.PI) / 4 + (row % 2) * 0.2
      const spike = addMesh(sword, tooth, skin, [
        Math.cos(angle) * 0.54,
        -0.9 + row * 0.28,
        Math.sin(angle) * 0.54,
      ])
      spike.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.cos(angle), 0.4, Math.sin(angle)).normalize(),
      )
    }
  }
  addMesh(
    sword,
    new THREE.CylinderGeometry(0.15, 0.15, 1.35, 14),
    ivory,
    [0, -2.3, 0],
  )
  for (let index = 0; index < 9; index++)
    addMesh(sword, new THREE.TorusGeometry(0.154, 0.026, 5, 16), skin, [
      0,
      -1.75 - index * 0.135,
      0,
    ]).rotation.x = Math.PI / 2
  addMesh(
    sword,
    new THREE.SphereGeometry(0.12, 12, 8),
    material(0xe1c368),
    [0, 1.88, 0.49],
  )
  sword.rotation.z = -0.42
  world.add(sword)
  const shoal = Array.from({ length: 9 }, (_, index) => {
    const fish = shark(world, material(index % 2 ? 0x48899e : 0x8bc9cd))
    fish.scale.setScalar(0.45 + (index % 3) * 0.18)
    return fish
  })
  const water = new THREE.MeshPhysicalMaterial({
    color: 0x3794b1,
    transparent: true,
    opacity: 0.27,
    roughness: 0.18,
    metalness: 0.35,
    side: THREE.DoubleSide,
  })
  const wave = addMesh(
    world,
    new THREE.PlaneGeometry(9, 3, 55, 20),
    water,
    [0, -2.4, -0.4],
  )
  const positions = wave.geometry.getAttribute('position')
  return (time, power, pointer) => {
    sword.rotation.y = pointer.x * 0.5 + Math.sin(time * 0.45) * 0.12
    sword.rotation.z = -0.42 + pointer.y * 0.15
    shoal.forEach((fish, index) => {
      fish.position.set(
        ((time * (0.3 + power * 0.9) + index * 1.1) % 10) - 5,
        Math.sin(index * 2 + time * 0.65) * (1 + power) - 0.4,
        -0.7 + (index % 3) * 0.65,
      )
      fish.rotation.y = Math.sin(time * 2 + index) * 0.2
    })
    for (let index = 0; index < positions.count; index++)
      positions.setZ(
        index,
        Math.sin(positions.getX(index) * 1.6 + time * 2) * 0.15 +
          Math.cos(positions.getY(index) * 2 + time) * 0.08,
      )
    positions.needsUpdate = true
    wave.position.y = -2.4 + power * 2.2
    water.opacity = 0.2 + power * 0.25
  }
}

function clayArt(world: THREE.Group): AnimateModel {
  const clay = material(0xeee8d7, 0.9)
  const sculpture = new THREE.Group()
  addMesh(
    sculpture,
    new THREE.SphereGeometry(0.65, 24, 16),
    clay,
    [0, 0.05, 0],
    [0.85, 1.2, 0.8],
  )
  addMesh(
    sculpture,
    new THREE.SphereGeometry(0.36, 20, 12),
    clay,
    [0, 0.8, 0.18],
    [0.85, 1, 1],
  )
  const beak = addMesh(
    sculpture,
    new THREE.ConeGeometry(0.13, 0.5, 10),
    material(0xe1d5b7),
    [0, 0.73, 0.62],
  )
  beak.rotation.x = Math.PI / 2
  const ink = material(0x26201d)
  for (const side of [-1, 1])
    addMesh(sculpture, new THREE.SphereGeometry(0.056, 8, 8), ink, [
      side * 0.22,
      0.9,
      0.43,
    ])
  const wings: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const wing = new THREE.Group()
    wing.position.set(side * 0.35, 0.35, 0)
    for (let index = 0; index < 7; index++) {
      const feather = addMesh(
        wing,
        new THREE.CapsuleGeometry(0.17, 1.45 - index * 0.09, 5, 10),
        clay,
        [side * (0.28 + index * 0.28), -index * 0.09, -index * 0.035],
      )
      feather.rotation.z = side * (-0.55 - index * 0.14)
    }
    sculpture.add(wing)
    wings.push(wing)
  }
  for (let index = 0; index < 3; index++)
    addMesh(sculpture, new THREE.CapsuleGeometry(0.1, 0.8, 5, 10), clay, [
      (index - 1) * 0.19,
      -0.96,
      0,
    ]).rotation.z = (index - 1) * 0.23
  world.add(sculpture)
  const fragments = new THREE.InstancedMesh(
    new THREE.TetrahedronGeometry(0.1),
    clay,
    340,
  )
  fragments.frustumCulled = false
  world.add(fragments)
  const transform = new THREE.Object3D()
  return (time, power, pointer) => {
    sculpture.rotation.set(
      pointer.y * 0.2,
      pointer.x * 0.4,
      Math.sin(time * 0.7) * 0.045,
    )
    sculpture.scale.setScalar(Math.max(0.03, 1 - power * 1.2))
    wings.forEach((wing, index) => {
      wing.rotation.y = Math.sin(time * 1.6) * 0.25 * (index ? 1 : -1)
    })
    for (let index = 0; index < 340; index++) {
      const azimuth = index * 2.399
      const elevation = Math.acos(1 - (2 * (index + 0.5)) / 340)
      const radius = power * (1.2 + (index % 11) * 0.28)
      transform.position.set(
        Math.cos(azimuth) * Math.sin(elevation) * radius,
        Math.sin(azimuth) * Math.sin(elevation) * radius,
        Math.cos(elevation) * radius,
      )
      transform.scale.setScalar(power * (0.4 + (index % 4) * 0.3))
      transform.rotation.set(index + time * power, index * 2, power * 4)
      transform.updateMatrix()
      fragments.setMatrixAt(index, transform.matrix)
    }
    fragments.instanceMatrix.needsUpdate = true
  }
}

function marionette(parent: THREE.Object3D, surface: THREE.Material) {
  const puppet = new THREE.Group()
  addMesh(
    puppet,
    new THREE.SphereGeometry(0.31, 16, 12),
    surface,
    [0, 1.4, 0],
    [0.85, 1.1, 0.8],
  )
  addMesh(
    puppet,
    new THREE.CylinderGeometry(0.36, 0.24, 0.85, 8),
    surface,
    [0, 0.55, 0],
  )
  const joints: THREE.Group[] = []
  const ebony = material(0x292726)
  for (const side of [-1, 1]) {
    addMesh(puppet, new THREE.SphereGeometry(0.04, 8, 6), ebony, [
      side * 0.1,
      1.43,
      0.23,
    ])
    const arm = new THREE.Group()
    arm.position.set(side * 0.42, 0.9, 0)
    addMesh(arm, new THREE.SphereGeometry(0.13, 10, 8), ebony)
    addMesh(
      arm,
      new THREE.CylinderGeometry(0.09, 0.075, 0.6, 10),
      surface,
      [0, -0.38, 0],
    )
    const elbow = new THREE.Group()
    elbow.position.y = -0.74
    addMesh(elbow, new THREE.SphereGeometry(0.1, 10, 8), ebony)
    addMesh(
      elbow,
      new THREE.CylinderGeometry(0.08, 0.065, 0.64, 10),
      surface,
      [0, -0.36, 0],
    )
    arm.add(elbow)
    puppet.add(arm)
    joints.push(arm, elbow)
    const leg = new THREE.Group()
    leg.position.set(side * 0.17, 0.05, 0)
    addMesh(
      leg,
      new THREE.CylinderGeometry(0.105, 0.08, 1, 10),
      surface,
      [0, -0.55, 0],
    )
    addMesh(leg, new THREE.BoxGeometry(0.2, 0.13, 0.4), ebony, [0, -1.1, 0.08])
    puppet.add(leg)
    joints.push(leg)
  }
  parent.add(puppet)
  return { puppet, joints }
}

function puppetTheatre(world: THREE.Group): AnimateModel {
  const wood = material(0xac7056, 0.65)
  const lead = marionette(world, wood)
  const extras = Array.from({ length: 10 }, () => marionette(world, wood))
  const stringGeometry = new THREE.BufferGeometry()
  const stringPositions = new Float32Array(8 * 3)
  stringGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(stringPositions, 3),
  )
  const strings = new THREE.LineSegments(
    stringGeometry,
    new THREE.LineBasicMaterial({
      color: 0x87d9d8,
      transparent: true,
      opacity: 0.8,
    }),
  )
  strings.frustumCulled = false
  world.add(strings)
  const controller = new THREE.Group()
  addMesh(controller, new THREE.BoxGeometry(2.4, 0.08, 0.1), wood)
  addMesh(controller, new THREE.BoxGeometry(0.1, 0.08, 1), wood)
  controller.position.y = 3.1
  world.add(controller)
  const endpoint = new THREE.Vector3()
  return (time, power, pointer) => {
    lead.puppet.rotation.y = pointer.x * 0.35
    lead.puppet.position.y = -pointer.y * 0.25
    lead.joints.forEach((joint, index) => {
      joint.rotation.z =
        Math.sin(time * 1.2 + index * 0.9) * (0.2 + power * 0.6) +
        pointer.x * (index % 2 ? -0.55 : 0.55)
    })
    controller.rotation.z = pointer.x * 0.2
    world.updateMatrixWorld(true)
    ;[0, 1, 3, 4].forEach((jointIndex, index) => {
      lead.joints[jointIndex].getWorldPosition(endpoint)
      world.worldToLocal(endpoint)
      stringPositions.set([(index - 1.5) * 0.6, 3.1, 0], index * 6)
      stringPositions.set([endpoint.x, endpoint.y, endpoint.z], index * 6 + 3)
    })
    stringGeometry.getAttribute('position').needsUpdate = true
    extras.forEach(({ puppet, joints }, index) => {
      const side = index % 2 ? -1 : 1
      puppet.position.set(
        side * (1.4 + Math.floor(index / 2) * 0.5) * power,
        Math.sin(index * 2) * 1.1,
        -1.4 - Math.floor(index / 2) * 0.2,
      )
      puppet.scale.setScalar(power * 0.45)
      joints.forEach((joint, jointIndex) => {
        joint.rotation.z = Math.sin(time * 1.6 + index + jointIndex) * 0.7
      })
    })
  }
}

function ritualScythe(world: THREE.Group): AnimateModel {
  const steel = material(0xbbb9b6, 0.2)
  const crimson = material(0xb63042, 0.35)
  const weapon = new THREE.Group()
  addMesh(
    weapon,
    new THREE.CylinderGeometry(0.09, 0.09, 5.8, 12),
    material(0x25252c),
  )
  for (let index = 0; index < 3; index++) {
    const blade = new THREE.Shape()
    blade.moveTo(0, 0.1)
    blade.bezierCurveTo(0.9, 0.3, 2.5, 0.05, 2.9 - index * 0.3, -1.35)
    blade.bezierCurveTo(1.5, -0.2, 0.65, -0.15, 0, -0.24)
    blade.closePath()
    const geometry = new THREE.ExtrudeGeometry(blade, {
      depth: 0.09,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      steps: 1,
      curveSegments: 30,
    })
    addMesh(weapon, geometry, crimson, [0, 2.45 - index * 0.88, 0])
    ribbon(
      [
        [0, 2.54 - index * 0.88, 0.12],
        [1.3, 2.56 - index * 0.88, 0.12],
        [2.9 - index * 0.3, 1.1 - index * 0.88, 0.12],
      ],
      0.025,
      steel,
      weapon,
    )
  }
  const rope = ribbon(
    [
      [0, -2.9, 0],
      [-0.8, -3.1, 0.1],
      [-1.7, -2.5, 0],
      [-1.4, -1.2, -0.3],
    ],
    0.035,
    material(0x8c807e),
    weapon,
  )
  weapon.position.x = -0.7
  weapon.rotation.z = 0.2
  world.add(weapon)
  const sigilPoints: THREE.Vector3[] = []
  for (let index = 0; index <= 100; index++)
    sigilPoints.push(
      new THREE.Vector3(
        Math.cos((index / 100) * Math.PI * 2) * 2.5,
        Math.sin((index / 100) * Math.PI * 2) * 2.5,
        -0.7,
      ),
    )
  const sigil = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(sigilPoints),
    new THREE.LineBasicMaterial({
      color: 0xb72e42,
      transparent: true,
      opacity: 0.3,
    }),
  )
  const triangle = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      [
        [0, -2.5, -0.7],
        [-2.16, 1.25, -0.7],
        [2.16, 1.25, -0.7],
      ].map((point) => new THREE.Vector3(...point)),
    ),
    sigil.material,
  )
  world.add(sigil, triangle)
  return (time, power, pointer) => {
    weapon.rotation.y = pointer.x * 0.5 + Math.sin(time * 0.45) * 0.08
    weapon.rotation.z = 0.2 + power * 0.25
    rope.rotation.y = Math.sin(time) * 0.05
    sigil.geometry.setDrawRange(0, Math.max(8, Math.floor(power * 101)))
    sigil.material.opacity = 0.15 + power * 0.75
    triangle.visible = power > 0.25
    world.position.y = Math.sin(time * 0.65) * 0.04
  }
}

export const chakraNatures = ['Earth', 'Water', 'Fire', 'Wind', 'Lightning']

function elementalMasks(world: THREE.Group): AnimateModel {
  const colors = [0x96877b, 0x6fbcc8, 0xe78752, 0xc1d3bd, 0xe8cf65]
  const centers: Position[] = [
    [0, -2, 0],
    [-2.2, -0.2, 0],
    [2.2, -0.2, 0],
    [-1.35, 1.9, 0],
    [1.35, 1.9, 0],
  ]
  const masks = centers.map((position, index) => {
    const mask = new THREE.Group()
    const ceramic = material(0xded9cc, 0.62)
    addMesh(
      mask,
      new THREE.SphereGeometry(0.63, 22, 16),
      ceramic,
      [0, 0, 0],
      [0.8, 1.1, 0.35],
    )
    const ink = material(colors[index])
    for (const side of [-1, 1]) {
      const eye = addMesh(
        mask,
        new THREE.SphereGeometry(0.11, 10, 8),
        ink,
        [side * 0.23, 0.15, 0.21],
        [1.1, 0.4, 0.35],
      )
      eye.rotation.z = side * -0.25
      const marking = addMesh(
        mask,
        new THREE.BoxGeometry(0.055, 0.48, 0.02),
        ink,
        [side * 0.27, -0.16, 0.21],
      )
      marking.rotation.z = side * 0.3
    }
    addMesh(
      mask,
      new THREE.BoxGeometry(0.26, 0.05, 0.03),
      material(0x232528),
      [0, -0.32, 0.24],
    )
    mask.position.set(...position)
    world.add(mask)
    return mask
  })
  const threadGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(5 * 6 * 24 * 2 * 3)
  threadGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3),
  )
  const threads = new THREE.LineSegments(
    threadGeometry,
    new THREE.LineBasicMaterial({
      color: 0x25322e,
      transparent: true,
      opacity: 0.85,
    }),
  )
  threads.frustumCulled = false
  world.add(threads)
  return (time, power, pointer, variant) => {
    world.rotation.y = pointer.x * 0.18
    let offset = 0
    masks.forEach((mask, maskIndex) => {
      const selected = variant === maskIndex
      mask.position.set(
        centers[maskIndex][0] * (0.8 + power * 0.25),
        centers[maskIndex][1] * (0.8 + power * 0.2) +
          Math.sin(time + maskIndex) * 0.05,
        selected ? 0.6 : 0,
      )
      mask.scale.setScalar(selected ? 1.15 : 0.88)
      mask.rotation.z = Math.sin(time * 0.5 + maskIndex) * 0.06
      for (let strand = 0; strand < 6; strand++) {
        for (let step = 0; step < 24; step++) {
          for (const edge of [0, 1]) {
            const progress = (step + edge) / 24
            const twist =
              Math.sin(progress * 12 + time * 1.3 + strand) *
              Math.sin(progress * Math.PI) *
              (0.13 + power * 0.2)
            positions[offset++] = mask.position.x * progress + twist
            positions[offset++] =
              mask.position.y * progress + Math.sin(progress * 8 + strand) * 0.1
            positions[offset++] =
              -0.25 + mask.position.z * progress + Math.cos(strand) * 0.05
          }
        }
      }
    })
    threadGeometry.getAttribute('position').needsUpdate = true
  }
}

function mayfly(world: THREE.Group): AnimateModel {
  const head = new THREE.Group()
  const pale = material(0xd9e3bf, 0.8)
  const dark = material(0x182a21, 0.8)
  addMesh(
    head,
    new THREE.SphereGeometry(0.78, 24, 20, -Math.PI / 2, Math.PI),
    dark,
    [0, 0.4, 0],
    [0.8, 1.1, 0.7],
  )
  addMesh(
    head,
    new THREE.SphereGeometry(0.78, 24, 20, Math.PI / 2, Math.PI),
    pale,
    [0, 0.4, 0],
    [0.8, 1.1, 0.7],
  )
  for (const side of [-1, 1])
    addMesh(
      head,
      new THREE.SphereGeometry(0.07, 10, 8),
      material(0xd7cf66),
      [side * 0.24, 0.55, 0.52],
      [1, 0.5, 0.5],
    )
  world.add(head)
  const leaves: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group()
    const shape = new THREE.Shape()
    shape.moveTo(0, -1.7)
    shape.bezierCurveTo(side * 2.8, -1.1, side * 3.1, 1.6, side * 1.6, 2.7)
    for (let index = 0; index < 10; index++) {
      const height = 2.7 - index * 0.41
      shape.lineTo(side * (1 + Math.sin(index * 0.3) * 0.4), height - 0.1)
      shape.lineTo(side * 1.55, height - 0.23)
    }
    shape.lineTo(0, -1.7)
    addMesh(
      leaf,
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.13,
        bevelEnabled: true,
        bevelSize: 0.05,
        bevelThickness: 0.06,
        bevelSegments: 2,
        steps: 1,
        curveSegments: 24,
      }),
      material(side === 1 ? 0x6b8e43 : 0x456b38),
      [0, 0, -0.4],
    )
    ribbon(
      [
        [0, -1.6, -0.2],
        [side * 1.9, -0.4, -0.2],
        [side * 2.1, 1.3, -0.2],
        [side * 1.6, 2.6, -0.2],
      ],
      0.027,
      material(0x97ac67),
      leaf,
    )
    world.add(leaf)
    leaves.push(leaf)
  }
  const spores = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.03),
    pale,
    90,
  )
  spores.frustumCulled = false
  world.add(spores)
  const transform = new THREE.Object3D()
  return (time, power, pointer) => {
    head.rotation.y = pointer.x * 0.4
    head.scale.setScalar(1 - power * 0.85)
    head.position.y = -power * 2.2
    leaves.forEach((leaf, index) => {
      leaf.rotation.y =
        (index ? 1 : -1) * (0.2 + power * 0.8 + Math.sin(time * 0.6) * 0.04)
    })
    for (let index = 0; index < 90; index++) {
      transform.position.set(
        Math.sin(index * 23) * 3,
        ((time * 0.22 + index * 0.17) % 5) - 2.5,
        Math.cos(index * 17),
      )
      transform.scale.setScalar(0.4 + power)
      transform.updateMatrix()
      spores.setMatrixAt(index, transform.matrix)
    }
    spores.instanceMatrix.needsUpdate = true
  }
}

function rainAndResolve(world: THREE.Group): AnimateModel {
  const city = new THREE.Group()
  const metal = material(0x708b91, 0.72)
  for (let index = 0; index < 9; index++) {
    const height = 1.1 + (index % 3) * 0.7
    addMesh(city, new THREE.BoxGeometry(0.42, height, 0.45), metal, [
      (index - 4) * 0.76,
      -2.5 + height / 2,
      -1.5,
    ])
    addMesh(
      city,
      new THREE.CylinderGeometry(0.045, 0.045, height + 0.7, 8),
      metal,
      [(index - 4) * 0.76 + 0.26, -2.2 + height / 2, -1.5],
    )
  }
  world.add(city)
  const cloth = new THREE.PlaneGeometry(1.55, 2.1, 18, 20)
  const banner = addMesh(world, cloth, material(0x2f5362), [0, 0.8, 0.2])
  addMesh(
    world,
    new THREE.CylinderGeometry(0.035, 0.035, 5.4, 8),
    metal,
    [-0.82, 0, 0.2],
  )
  const clothPositions = cloth.getAttribute('position')
  const waveGeometry = new THREE.PlaneGeometry(8, 2.1, 70, 20)
  const wave = addMesh(
    world,
    waveGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0x83cbd7,
      metalness: 0.25,
      roughness: 0.18,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
    }),
    [0, -2.7, 0.8],
  )
  const wavePositions = waveGeometry.getAttribute('position')
  const drops = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.16, 3),
    material(0xc5e5ed),
    200,
  )
  drops.frustumCulled = false
  world.add(drops)
  const transform = new THREE.Object3D()
  return (time, power, pointer) => {
    world.rotation.y = pointer.x * 0.12
    for (let index = 0; index < clothPositions.count; index++)
      clothPositions.setZ(
        index,
        Math.sin(clothPositions.getX(index) * 3 - time * 1.8) *
          0.14 *
          (clothPositions.getX(index) + 0.8),
      )
    clothPositions.needsUpdate = true
    banner.rotation.z = Math.sin(time * 0.5) * 0.025
    for (let index = 0; index < wavePositions.count; index++)
      wavePositions.setZ(
        index,
        Math.sin(wavePositions.getX(index) * 1.25 - time * 2.6) *
          (0.12 + power * 0.35) +
          Math.sin(wavePositions.getY(index) * 2) * 0.15,
      )
    wavePositions.needsUpdate = true
    wave.position.y = -2.7 + power * 2.8
    for (let index = 0; index < 200; index++) {
      const horizontal = Math.sin(index * 137) * 4
      transform.position.set(
        horizontal + pointer.x * 0.2,
        3.5 - ((time * 2 + index * 0.073) % 7),
        Math.cos(index * 83) * 2,
      )
      transform.rotation.z = -0.1 - pointer.x * 0.1
      transform.scale.setScalar(1 - power * 0.55)
      transform.updateMatrix()
      drops.setMatrixAt(index, transform.matrix)
    }
    drops.instanceMatrix.needsUpdate = true
  }
}

export function createMemberModel(
  world: THREE.Group,
  ability: MemberAbility,
): AnimateModel {
  const factories = {
    konan: paperWings,
    kisame: samehada,
    deidara: clayArt,
    sasori: puppetTheatre,
    hidan: ritualScythe,
    kakuzu: elementalMasks,
    zetsu: mayfly,
    yahiko: rainAndResolve,
  }
  if (ability === 'deidara' || ability === 'sasori' || ability === 'kakuzu')
    world.scale.setScalar(1.25)
  return factories[ability](world)
}
