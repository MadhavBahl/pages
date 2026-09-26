import { expect, test, type Locator, type Page } from '@playwright/test'
import { chapterOrder } from '../src/memberChapters'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

async function scrollTo(page: Page, id: string) {
  await page.evaluate(
    (id) =>
      document.getElementById(id)!.scrollIntoView({ behavior: 'instant' }),
    id,
  )
}

async function canvasFrames(canvas: Locator) {
  return canvas.evaluate(
    (element: HTMLCanvasElement) =>
      new Promise<{ opaque: number; moving: boolean }>((resolve) => {
        const context = element.getContext('webgl2')!
        let frames = 0
        let firstChecksum: number | undefined
        let maximumPixels = 0
        let moving = false
        const pixels = new Uint8Array(element.width * element.height * 4)
        function sample() {
          context.readPixels(
            0,
            0,
            element.width,
            element.height,
            context.RGBA,
            context.UNSIGNED_BYTE,
            pixels,
          )
          let checksum = 0
          let opaque = 0
          for (let index = 0; index < pixels.length; index += 16) {
            checksum +=
              pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7
            if (pixels[index + 3]) opaque++
          }
          maximumPixels = Math.max(maximumPixels, opaque)
          if (opaque > 0) {
            if (firstChecksum === undefined) firstChecksum = checksum
            else if (checksum !== firstChecksum) moving = true
          }
          frames++
          if (frames === 30) resolve({ opaque: maximumPixels, moving })
          else requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      }),
  )
}

test('React archive preserves all twelve dossiers, filters, and focus', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.member-card')).toHaveCount(6)
  await page.locator('#show-members').click()
  await expect(page.locator('.member-card')).toHaveCount(12)
  for (const id of [
    'itachi',
    'pain',
    'konan',
    'kisame',
    'deidara',
    'sasori',
    'tobi',
    'hidan',
    'kakuzu',
    'zetsu',
    'yahiko',
    'orochimaru',
  ]) {
    const card = page.locator(`.member-card[data-member="${id}"]`)
    await card.click()
    await expect(page.locator('#member-dialog')).toBeVisible()
    await expect(page.locator('.dossier-copy li')).toHaveCount(3)
    await page
      .locator('.dossier-portrait img')
      .evaluate((image: HTMLImageElement) => image.decode())
    await page.keyboard.press('Escape')
    await expect(page.locator('#member-dialog')).toHaveCount(0)
    await expect(card).toBeFocused()
  }
  await page.locator('[data-filter="legacy"]').click()
  await expect(page.locator('.member-card')).toHaveCount(2)
  await page.locator('[data-filter="core"]').click()
  await expect(page.locator('.member-card')).toHaveCount(10)
  await page.locator('#member-search').fill('Itachi')
  await expect(page.locator('.member-card')).toHaveCount(1)
  await page.locator('#member-search').fill('no-such-member')
  await expect(page.locator('#empty-state')).toBeVisible()
})

test('Itachi capture is timed automatically and persistent when requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await scrollTo(page, 'itachi')
  await expect(page.locator('#illusion')).toBeVisible()
  await expect(page.locator('#experience')).toHaveAttribute('inert', '')
  await expect(page.locator('#escape-illusion')).toBeFocused()
  await expect(page.locator('#illusion')).toHaveCount(0, { timeout: 3000 })
  await expect(page.locator('#experience')).not.toHaveAttribute('inert')
  await page.locator('#genjutsu-trigger').click()
  await expect(page.locator('#illusion')).toBeVisible()
  if (!page.viewportSize() || page.viewportSize()!.width >= 760) {
    const gaze = page.locator('.sharingan-gaze')
    await page.mouse.move(page.viewportSize()!.width - 20, 40)
    await expect.poll(() => gaze.evaluate((element) => getComputedStyle(element).getPropertyValue('--gaze-x'))).not.toBe('0.0000')
    await expect.poll(() => gaze.evaluate((element) => getComputedStyle(element).getPropertyValue('--gaze-y'))).not.toBe('0.0000')
  }
  await page.waitForTimeout(2200)
  await expect(page.locator('#illusion')).toBeVisible()
  await expect(page.locator('#experience')).toHaveAttribute('inert', '')
  await page.keyboard.press('Escape')
  await expect(page.locator('#illusion')).toHaveCount(0)
  await expect(page.locator('#genjutsu-trigger')).toBeFocused()
})

test('new chapters precede archive and animate their abilities', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('#assembly-canvas')).toBeVisible()
  await expect
    .poll(
      async () => (await canvasFrames(page.locator('#assembly-canvas'))).opaque,
    )
    .toBeGreaterThan(100)
  expect(
    await page
      .locator('main>section[id]')
      .evaluateAll((elements) => elements.map((element) => element.id)),
  ).toEqual(['manifesto', 'itachi', ...chapterOrder, 'members', 'origin'])
  for (const id of chapterOrder) {
    await scrollTo(page, id)
    const canvas = page.locator(`#${id}-canvas`)
    await expect(canvas).toBeVisible()
    await expect
      .poll(() =>
        canvas.evaluate((element: HTMLCanvasElement) => element.width),
      )
      .toBeGreaterThan(300)
    const frames = await canvasFrames(canvas)
    expect(frames.opaque, `${id} must render visible geometry`).toBeGreaterThan(
      100,
    )
    expect(frames.moving, `${id} must animate`).toBe(true)
    const dimensions = await page
      .locator(`#${id} .chapter-art img`)
      .evaluate(async (image: HTMLImageElement) => {
        await image.decode()
        return { width: image.naturalWidth, height: image.naturalHeight }
      })
    expect(dimensions.width).toBeGreaterThanOrEqual(id === 'tobi' ? 500 : 1280)
    expect(dimensions.height).toBeGreaterThanOrEqual(720)
    await page.locator(`#${id}`).screenshot({
      path: testInfo.outputPath(`${id}.png`),
    })
    await page.locator(`#${id}-ability`).click()
    await expect(page.locator(`#${id}`)).toHaveAttribute('data-active', 'true')
    await expect(page.locator(`#${id}-ability`)).toBeDisabled()
    await expect(page.locator(`#${id}`)).toHaveAttribute(
      'data-active',
      'false',
      { timeout: 6000 },
    )
    await expect(page.locator(`#${id}-ability`)).toBeEnabled()
    await page.locator(`#${id} [data-member]`).click()
    await expect(page.locator('#member-dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator(`#${id} [data-member]`)).toBeFocused()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false)
  }
  await scrollTo(page, 'konan')
  await expect
    .poll(
      async () => (await canvasFrames(page.locator('#konan-canvas'))).opaque,
    )
    .toBeGreaterThan(100)
  expect(
    await page.locator('.chapter-canvas canvas').count(),
  ).toBeLessThanOrEqual(4)
  expect(errors).toEqual([])
})

test('header audio, motion, and mobile navigation remain usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('#sound-toggle').click()
  await expect(page.locator('#sound-toggle')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.locator('#sound-toggle').click()
  await expect(page.locator('#sound-toggle')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await page.locator('#motion-toggle').click()
  await expect(page.locator('#motion-toggle')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await page.locator('#motion-toggle').click()
  await expect(page.locator('#motion-toggle')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  if (page.viewportSize()!.width < 760) {
    await page.locator('#menu-toggle').click()
    await expect(page.locator('#mobile-nav')).toBeVisible()
    await page.locator('#mobile-nav a[href="#origin"]').click()
    await expect(page.locator('#mobile-nav')).toBeHidden()
    await expect(page).toHaveURL(/#origin$/)
  }
})

test('reduced motion and compact layouts remain usable', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('#motion-toggle')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await scrollTo(page, 'itachi')
  await page.locator('#genjutsu-trigger').click()
  await expect(page.locator('#illusion')).toHaveCount(0)
  await expect(page.locator('#experience')).not.toHaveAttribute('inert')
  for (const id of chapterOrder) {
    await scrollTo(page, id)
    await page.locator(`#${id}-ability`).click()
    await expect(page.locator(`#${id}`)).toHaveAttribute('data-active', 'true')
    const frames = await canvasFrames(page.locator(`#${id}-canvas`))
    expect(frames.moving).toBe(false)
  }
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 960 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false)
    for (const id of chapterOrder) {
      const layout = await page.locator(`#${id}`).evaluate((section) => {
        const heading = section.querySelector('h2')!
        const story = section
          .querySelector('.chapter-story')!
          .getBoundingClientRect()
        const actions = section
          .querySelector('.chapter-actions')!
          .getBoundingClientRect()
        const bottom = section
          .querySelector('.chapter-bottom')!
          .getBoundingClientRect()
        return {
          headingFits: heading.scrollWidth <= heading.clientWidth,
          copySeparated: story.bottom <= actions.top,
          footerSeparated: actions.bottom <= bottom.top,
        }
      })
      expect(layout).toEqual({
        headingFits: true,
        copySeparated: true,
        footerSeparated: true,
      })
    }
  }
})

test('Kakuzu selects each chakra nature without affecting other chapters', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#kakuzu')
  const selector = page.getByRole('group', { name: 'Chakra nature' })
  for (const [index, nature] of [
    'Earth',
    'Water',
    'Fire',
    'Wind',
    'Lightning',
  ].entries()) {
    await selector.getByRole('button', { name: nature, exact: true }).click()
    await expect(selector.locator('[aria-pressed=true]')).toHaveCount(1)
    await expect(page.locator('#kakuzu')).toHaveAttribute(
      'data-variant',
      String(index),
    )
  }
  await scrollTo(page, 'yahiko')
  await expect(page.locator('#kakuzu-canvas')).toHaveCount(0)
  await scrollTo(page, 'kakuzu')
  await expect(page.locator('#kakuzu-canvas')).toBeVisible()
  await expect(
    selector.getByRole('button', { name: 'Lightning', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('ability controls release after their 2.4-second timer', async ({
  page,
}) => {
  await page.clock.install()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#konan')
  await page.locator('#konan-ability').click()
  await expect(page.locator('#konan')).toHaveAttribute('data-active', 'true')
  await page.clock.fastForward(2400)
  await expect(page.locator('#konan')).toHaveAttribute('data-active', 'false')
  await expect(page.locator('#konan-ability')).toBeEnabled()
})

test('character assembly replaces the cloud with real transparent artwork', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('.assembly-hero')).toHaveAttribute(
    'data-ready',
    'true',
  )
  await expect(page.locator('#cloud-canvas')).toHaveCount(0)
  const frames = await canvasFrames(page.locator('#assembly-canvas'))
  expect(frames.opaque).toBeGreaterThan(1000)
  expect(frames.moving).toBe(true)
  await page
    .getByRole('group', { name: 'Akatsuki lineup' })
    .getByRole('button', { name: 'Obito', exact: true })
    .click()
  await expect(
    page.getByRole('link', { name: "Explore Obito's chapter" }),
  ).toHaveAttribute('href', '#tobi')
  await expect(
    page.locator('.assembly-select [aria-pressed=true]'),
  ).toHaveCount(1)
  await page.locator('#motion-toggle').click()
  await page.screenshot({ path: testInfo.outputPath('assembly.png') })
  for (const id of ['itachi', 'kisame', 'konan', 'pain', 'tobi']) {
    const image = sharp(
      fileURLToPath(new URL(`../public/cutouts/${id}.webp`, import.meta.url)),
    )
    const metadata = await image.metadata()
    expect(metadata.hasAlpha).toBe(true)
    expect(metadata.height).toBeGreaterThan(1000)
    const alpha = (await image.stats()).channels[3]
    expect(alpha.min).toBe(0)
    expect(alpha.max).toBe(255)
  }
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport)
    const layout = await page.evaluate(() => {
      const heading = document.querySelector('#hero-title')!
      const stage = document
        .querySelector('.assembly-stage')!
        .getBoundingClientRect()
      const footer = document
        .querySelector('.assembly-footer')!
        .getBoundingClientRect()
      const ticker = document
        .querySelector('.manifesto-ticker')!
        .getBoundingClientRect()
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        headingFits: heading.scrollWidth <= heading.clientWidth,
        stageAboveControls: stage.bottom <= footer.top + 20,
        nextSectionVisible: ticker.top < innerHeight,
      }
    })
    expect(layout).toEqual({
      overflow: false,
      headingFits: true,
      stageAboveControls: true,
      nextSectionVisible: true,
    })
  }
  expect(errors).toEqual([])
})

test('Obito warps an alpha cutout instead of the chapter photograph', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await scrollTo(page, 'tobi')
  await expect(page.locator('#tobi')).toHaveClass(/kamui-ready/)
  await expect(page.locator('#tobi .chapter-art img')).toHaveAttribute(
    'src',
    '/cutouts/tobi.webp',
  )
  await expect(page.locator('#tobi .chapter-art-shade')).toBeHidden()
  const frames = await canvasFrames(page.locator('#tobi-canvas'))
  expect(frames.opaque).toBeGreaterThan(1000)
  expect(frames.moving).toBe(true)
  await page
    .locator('#tobi')
    .screenshot({ path: testInfo.outputPath('obito-idle.png') })
  const background = await page
    .locator('#tobi .chapter-texture')
    .evaluate((element) => getComputedStyle(element).transform)
  await page.locator('#tobi-ability').click()
  await expect(page.locator('#tobi')).toHaveAttribute('data-active', 'true')
  await page
    .locator('#tobi')
    .screenshot({ path: testInfo.outputPath('obito-warp.png') })
  expect(
    await page
      .locator('#tobi .chapter-texture')
      .evaluate((element) => getComputedStyle(element).transform),
  ).toBe(background)
  expect(
    await page
      .locator('#tobi .chapter-art img')
      .evaluate((element) => getComputedStyle(element).transform),
  ).toBe('none')
  await expect(page.locator('#tobi')).toHaveAttribute('data-active', 'false', {
    timeout: 6000,
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#tobi-ability').click()
  expect((await canvasFrames(page.locator('#tobi-canvas'))).moving).toBe(false)
  expect(errors).toEqual([])
})
