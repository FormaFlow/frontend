import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'

const baseUrl = process.env.FORMAFLOW_SMOKE_URL
const outputDir = process.env.FORMAFLOW_SMOKE_OUTPUT
if (!baseUrl || !outputDir) throw new Error('FORMAFLOW_SMOKE_URL and FORMAFLOW_SMOKE_OUTPUT are required')

await mkdir(outputDir, {recursive: true})
const browser = await chromium.launch({headless: true})
const failures = []

async function observe(page, label) {
  page.on('pageerror', error => failures.push(`${label} pageerror: ${error.stack ?? error.message}`))
  page.on('response', response => {
    if (response.status() >= 400) failures.push(`${label} HTTP ${response.status()}: ${response.url()}`)
  })
}

const mobile = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, ignoreHTTPSErrors: true})
const mobilePage = await mobile.newPage()
await observe(mobilePage, 'mobile')
await mobilePage.goto(`${baseUrl}/login`)
await mobilePage.getByRole('button', {name: 'Ученик'}).click()
await mobilePage.getByLabel('Код семьи').fill(process.env.FORMAFLOW_CHILD_WORKSPACE ?? '')
await mobilePage.getByLabel('Логин').fill(process.env.FORMAFLOW_CHILD_LOGIN ?? '')
await mobilePage.getByLabel('PIN').fill(process.env.FORMAFLOW_CHILD_PIN ?? '')
await mobilePage.screenshot({path: `${outputDir}/01-vova-login-mobile.png`, fullPage: true})
await mobilePage.getByRole('button', {name: 'Начать учиться'}).click()
await mobilePage.waitForURL('**/learn')
await mobilePage.getByRole('heading', {name: /Привет, Вова/}).waitFor()
await mobilePage.getByRole('link', {name: /Математика: уверенная база за 1 класс/}).waitFor()
await mobilePage.getByText('Вход выполнен', {exact: true}).waitFor({state: 'detached', timeout: 6000})
await mobilePage.screenshot({path: `${outputDir}/02-vova-plan-mobile.png`, fullPage: true})
const mobileOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
await mobile.close()

const desktop = await browser.newContext({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1, ignoreHTTPSErrors: true})
await desktop.addInitScript(workspaceId => {
  localStorage.setItem('workspace_id', workspaceId)
  localStorage.setItem('theme', 'dark')
}, process.env.FORMAFLOW_FAMILY_WORKSPACE_ID ?? '')
const desktopPage = await desktop.newPage()
await observe(desktopPage, 'desktop')
await desktopPage.goto(`${baseUrl}/login`)
await desktopPage.locator('input[type="email"]').fill(process.env.FORMAFLOW_BELLA_EMAIL ?? '')
await desktopPage.locator('input[type="password"]').fill(process.env.FORMAFLOW_BELLA_PASSWORD ?? '')
await desktopPage.locator('form').getByRole('button').click()
await desktopPage.waitForURL('**/admin')
await desktopPage.goto(`${baseUrl}/learn`)
await desktopPage.getByRole('heading', {name: /Привет, Bella Twilight/}).waitFor()
await desktopPage.getByRole('link', {name: /Математика: вступительная работа после 4 класса/}).waitFor()
await desktopPage.screenshot({path: `${outputDir}/03-anya-plan-desktop-dark.png`, fullPage: true})
await desktopPage.getByRole('link', {name: /Математика: вступительная работа после 4 класса/}).click()
await desktopPage.waitForURL('**/learn/assignments/**')
await desktopPage.locator('.katex').first().waitFor()
await desktopPage.screenshot({path: `${outputDir}/04-advanced-math-katex-desktop-dark.png`, fullPage: true})
const desktopOverflow = await desktopPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const formulaColor = await desktopPage.locator('.katex').first().evaluate(element => getComputedStyle(element).color)
await desktop.close()
await browser.close()

if (failures.length) throw new Error(failures.join('\n'))
console.log(JSON.stringify({mobileOverflow, desktopOverflow, formulaColor, screenshots: 4}))
