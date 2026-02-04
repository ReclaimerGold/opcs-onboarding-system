<template>
  <div class="bg-white shadow rounded-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-2">Signature Placement</h3>
    <p class="text-sm text-gray-500 mb-4">
      {{ formTypeLock ? 'Add at least one signature placement: drag the signature field onto the document, position and resize, then click Save placement. Add more placements only for pages that need a signature.' : 'Add at least one signature placement per document. Drag the field onto the page(s) that need a signature, then position and resize. You can add placements on additional pages if needed.' }}
    </p>

    <div v-if="!formTypeLock" class="flex flex-wrap items-center gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Form type</label>
        <select
          v-model="selectedFormType"
          class="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          @change="onFormTypeChange"
        >
          <option value="W4">W-4</option>
          <option value="I9">I-9</option>
          <option value="8850">Form 8850</option>
        </select>
      </div>
    </div>

    <div class="flex gap-4 flex-col lg:flex-row">
      <!-- Sidebar: pages + draggable signature field -->
      <aside class="w-full lg:w-52 flex-shrink-0 border border-gray-200 rounded-lg bg-gray-50 p-3 h-fit">
        <div class="text-sm font-medium text-gray-700 mb-2">Pages</div>
        <div class="space-y-1 mb-4">
          <button
            v-for="n in numPages"
            :key="n"
            type="button"
            :class="[
              'w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between',
              selectedPage === n
                ? 'bg-primary text-white'
                : placementForPage(n - 1) ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-white border border-gray-200 hover:bg-gray-100'
            ]"
            @click="selectedPage = n; renderPage()"
          >
            <span>Page {{ n }}</span>
            <span v-if="placementForPage(n - 1)" class="text-xs">✓</span>
          </button>
        </div>
        <div class="text-sm font-medium text-gray-700 mb-2">Add signature</div>
        <div
          class="border-2 border-dashed border-primary rounded-lg p-3 bg-white cursor-grab active:cursor-grabbing text-center select-none"
          draggable="true"
          @dragstart="onSignatureDragStart"
          @dragend="onSignatureDragEnd"
        >
          <div class="w-full border-b-2 border-gray-400 mb-1" />
          <span class="text-xs italic text-gray-600" style="font-family: Georgia, serif;">Signature</span>
          <p class="text-xs text-gray-500 mt-1">Drag onto page</p>
        </div>
      </aside>

      <!-- Main: high-res PDF + overlay -->
      <div class="flex-1 min-w-0">
        <div v-if="numPages > 0 && canvasReady" class="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-800 mb-3">
          <span><strong>Page {{ selectedPage }}</strong> — Drag the signature box from the sidebar onto the form, or move/resize the box below. Then <strong>Save placement</strong>.</span>
        </div>

        <!-- Zoom controls -->
        <div v-if="numPages > 0 && canvasReady" class="flex items-center gap-2 mb-2">
          <span class="text-sm text-gray-600">Zoom:</span>
          <button type="button" class="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" @click="zoomOut" :disabled="scale <= 0.5">−</button>
          <span class="text-sm tabular-nums min-w-[3rem]">{{ Math.round(scale * 100) }}%</span>
          <button type="button" class="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" @click="zoomIn" :disabled="scale >= 4">+</button>
          <button type="button" class="ml-2 px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" @click="fitPage">Fit page</button>
        </div>
        <div
          ref="viewerWrapperRef"
          class="border border-gray-300 rounded-lg overflow-auto bg-gray-100 flex justify-center items-start"
          style="max-height: 70vh; min-height: 400px;"
          @dragover.prevent="onCanvasDragover"
          @drop.prevent="onCanvasDrop"
        >
          <div v-if="pdfLoadError" class="p-6 text-center text-red-600 self-center">
            {{ pdfLoadError }}
          </div>
          <div v-else-if="loadingPdf" class="p-12 text-center text-gray-500 self-center">
            Loading PDF…
          </div>
          <div
            v-else-if="numPages > 0"
            ref="containerRef"
            class="relative flex-shrink-0 shadow-lg"
            :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
          >
            <canvas ref="canvasRef" class="block" :width="canvasWidth" :height="canvasHeight" />
            <!-- Signature box for current page: draggable + right-edge resize -->
            <div
              v-if="showOverlay"
              class="absolute border-2 border-primary rounded flex flex-col items-center justify-center overflow-visible shadow-md hover:border-primary-light transition-all select-none"
              :style="{
                left: boxDisplayX + 'px',
                top: boxDisplayY + 'px',
                width: Math.max(60, boxDisplayW) + 'px',
                height: Math.max(36, boxDisplayH) + 'px',
                backgroundColor: 'rgba(255,255,255,0.95)'
              }"
            >
              <div
                class="absolute inset-0 cursor-move rounded"
                @mousedown.prevent="startDrag"
              />
              <!-- Signature preview: same scale & top-left placement as backend drawSignatureOnPdf -->
              <div class="pointer-events-none absolute left-0 top-0 overflow-hidden" :style="signaturePreviewStyle">
                <svg class="block" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <path d="M10 50C30 20 70 20 90 50C110 80 150 80 170 50C190 20 230 20 250 50C270 80 290 80 290 80" stroke="black" stroke-width="2"/>
                  <text x="10" y="80" font-family="Georgia, serif" font-size="40" fill="black">Signature</text>
                </svg>
              </div>
              <!-- Right-edge resize handle -->
              <div
                class="absolute top-0 right-0 w-2 h-full cursor-ew-resize flex items-center justify-center group"
                @mousedown.prevent="startResizeWidth"
              >
                <span class="w-0.5 h-8 bg-primary/50 group-hover:bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 mt-4">
          <button
            type="button"
            :disabled="saving || !canvasReady"
            class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            @click="savePlacement"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save placement</span>
          </button>
          <button
            v-if="placementForPage(selectedPage - 1)"
            type="button"
            class="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
            @click="removePlacementForCurrentPage"
          >
            Remove from this page
          </button>
          <span v-if="!hasPlacementOnCurrentPage && canvasReady" class="text-sm text-gray-500">
            Drag the signature field from the sidebar onto the page, or add it and click Save.
          </span>
        </div>

        <div v-if="saveMessage" :class="['text-sm p-3 rounded-md mt-2', saveSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800']">
          {{ saveMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import api from '../../services/api.js'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

const props = defineProps({
  /** When set (W4, I9, 8850), form type dropdown is hidden and this value is used. */
  formTypeLock: { type: String, default: null }
})

const emit = defineEmits(['saved'])

const DEFAULT_PDF_BOX = { x: 72, y: 120, width: 180, height: 40 }
const MIN_SCALE = 0.5
const MAX_SCALE = 4
const DEFAULT_SCALE = 2.5
// Placeholder signature intrinsic size (matches backend logic: scale = min(boxW/imgW, boxH/imgH, 1), draw at top-left)
const SIGNATURE_IMG_W = 300
const SIGNATURE_IMG_H = 100

let pdfDoc = null
let dragStart = null
let resizeStart = null

const selectedFormType = ref(props.formTypeLock || 'W4')
const selectedPage = ref(1)
const numPages = ref(0)
const loadingPdf = ref(false)
const pdfLoadError = ref('')
const saving = ref(false)
const saveMessage = ref('')
const saveSuccess = ref(false)
const viewerWrapperRef = ref(null)
const containerRef = ref(null)
const canvasRef = ref(null)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const pdfWidthPoints = ref(612)
const pdfHeightPoints = ref(792)
const scale = ref(DEFAULT_SCALE)
const canvasReady = ref(false)

const placements = ref([])
const boxDisplayX = ref(0)
const boxDisplayY = ref(0)
const boxDisplayW = ref(200)
const boxDisplayH = ref(50)

function placementForPage(pageIndex) {
  return placements.value.find(p => p.pageIndex === pageIndex)
}

const hasPlacementOnCurrentPage = computed(() => placementForPage(selectedPage.value - 1))
const showOverlay = computed(() => canvasReady.value && numPages.value > 0 && hasPlacementOnCurrentPage.value)
const hasPlacement = computed(() => placements.value.length > 0)

// Match backend drawSignatureOnPdf: scale to fit box, never scale up; draw at top-left
const signaturePreviewStyle = computed(() => {
  const placeW = boxDisplayW.value
  const placeH = boxDisplayH.value
  const scaleFactor = Math.min(placeW / SIGNATURE_IMG_W, placeH / SIGNATURE_IMG_H, 1)
  const drawW = SIGNATURE_IMG_W * scaleFactor
  const drawH = SIGNATURE_IMG_H * scaleFactor
  return {
    width: `${drawW}px`,
    height: `${drawH}px`
  }
})

async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
  }
  return pdfjsLib
}

async function fetchPdf() {
  loadingPdf.value = true
  pdfLoadError.value = ''
  canvasReady.value = false
  try {
    const { data } = await api.get('/admin/pdf-templates/' + selectedFormType.value + '/preview', { responseType: 'arraybuffer' })
    const pdfjsLib = await loadPdfJs()
    pdfDoc = await pdfjsLib.getDocument({ data }).promise
    numPages.value = pdfDoc.numPages
    selectedPage.value = Math.min(selectedPage.value || 1, pdfDoc.numPages) || 1
    loadingPdf.value = false
    await nextTick()
    await renderPage()
  } catch (err) {
    console.error('PDF load error:', err)
    pdfLoadError.value = err.response?.status === 404 ? 'Template not found. Download the template first.' : 'Failed to load PDF.'
    numPages.value = 0
  } finally {
    loadingPdf.value = false
  }
}

async function renderPage() {
  if (!pdfDoc || !canvasRef.value) return
  const page = await pdfDoc.getPage(selectedPage.value)
  const baseViewport = page.getViewport({ scale: 1 })
  pdfWidthPoints.value = baseViewport.width
  pdfHeightPoints.value = baseViewport.height
  const scaleToUse = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value))
  scale.value = scaleToUse
  const viewport = page.getViewport({ scale: scaleToUse })
  canvasWidth.value = viewport.width
  canvasHeight.value = viewport.height
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: ctx, viewport }).promise
  canvasReady.value = true
  applyPlacementToOverlay()
}

function zoomIn() {
  scale.value = Math.min(MAX_SCALE, scale.value * 1.25)
  if (pdfDoc && canvasRef.value) renderPage()
}

function zoomOut() {
  scale.value = Math.max(MIN_SCALE, scale.value / 1.25)
  if (pdfDoc && canvasRef.value) renderPage()
}

async function fitPage() {
  if (!viewerWrapperRef.value || !pdfWidthPoints.value || !pdfHeightPoints.value) return
  const wrap = viewerWrapperRef.value
  const cw = Math.max(wrap.clientWidth || 0, wrap.offsetWidth || 0, 400)
  const ch = Math.max(wrap.clientHeight || 0, wrap.offsetHeight || 0, 400)
  const pageW = pdfWidthPoints.value
  const pageH = pdfHeightPoints.value
  if (pageW > 0 && pageH > 0) {
    scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, cw / pageW, ch / pageH))
    if (pdfDoc && canvasRef.value) await renderPage()
  }
}

function pdfToDisplay(pdfX, pdfY, pdfW, pdfH) {
  const s = scale.value
  const h = pdfHeightPoints.value
  return {
    x: pdfX * s,
    y: (h - pdfY - pdfH) * s,
    w: pdfW * s,
    h: pdfH * s
  }
}

function displayToPdf(displayX, displayY, displayW, displayH) {
  const s = scale.value
  const h = pdfHeightPoints.value
  return {
    x: displayX / s,
    y: h - (displayY + displayH) / s,
    w: displayW / s,
    h: displayH / s
  }
}

async function loadPlacement() {
  saveMessage.value = ''
  try {
    const res = await api.get('/admin/settings/signature-placement', { params: { formType: selectedFormType.value } })
    const list = res.data.placements
    placements.value = Array.isArray(list) ? list : []
    const forPage = placementForPage(selectedPage.value - 1)
    if (forPage) {
      const d = pdfToDisplay(forPage.x ?? 72, forPage.y ?? 120, forPage.width ?? 180, forPage.height ?? 40)
      boxDisplayX.value = d.x
      boxDisplayY.value = d.y
      boxDisplayW.value = d.w
      boxDisplayH.value = d.h
    } else {
      const d = pdfToDisplay(DEFAULT_PDF_BOX.x, DEFAULT_PDF_BOX.y, DEFAULT_PDF_BOX.width, DEFAULT_PDF_BOX.height)
      boxDisplayX.value = d.x
      boxDisplayY.value = d.y
      boxDisplayW.value = d.w
      boxDisplayH.value = d.h
    }
    if (pdfDoc && canvasRef.value) await renderPage()
  } catch (err) {
    console.error('Load placement error:', err)
    placements.value = []
    const d = pdfToDisplay(DEFAULT_PDF_BOX.x, DEFAULT_PDF_BOX.y, DEFAULT_PDF_BOX.width, DEFAULT_PDF_BOX.height)
    boxDisplayX.value = d.x
    boxDisplayY.value = d.y
    boxDisplayW.value = d.w
    boxDisplayH.value = d.h
  }
}

function applyPlacementToOverlay() {
  const forPage = placementForPage(selectedPage.value - 1)
  if (forPage) {
    const d = pdfToDisplay(forPage.x ?? 72, forPage.y ?? 120, forPage.width ?? 180, forPage.height ?? 40)
    boxDisplayX.value = d.x
    boxDisplayY.value = d.y
    boxDisplayW.value = d.w
    boxDisplayH.value = d.h
  } else {
    const d = pdfToDisplay(DEFAULT_PDF_BOX.x, DEFAULT_PDF_BOX.y, DEFAULT_PDF_BOX.width, DEFAULT_PDF_BOX.height)
    boxDisplayX.value = d.x
    boxDisplayY.value = d.y
    boxDisplayW.value = d.w
    boxDisplayH.value = d.h
  }
}

function onSignatureDragStart(e) {
  e.dataTransfer.setData('text/plain', 'signature-field')
  e.dataTransfer.effectAllowed = 'copy'
}

function onSignatureDragEnd() {}

function onCanvasDragover(e) {
  e.dataTransfer.dropEffect = 'copy'
}

function onCanvasDrop(e) {
  if (e.dataTransfer.getData('text/plain') !== 'signature-field' || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const displayX = e.clientX - rect.left
  const displayY = e.clientY - rect.top
  const w = boxDisplayW.value
  const h = boxDisplayH.value
  const x = Math.max(0, Math.min(displayX - w / 2, canvasWidth.value - w))
  const y = Math.max(0, Math.min(displayY - h / 2, canvasHeight.value - h))
  boxDisplayX.value = x
  boxDisplayY.value = y
  const pageIndex = selectedPage.value - 1
  const existing = placements.value.findIndex(p => p.pageIndex === pageIndex)
  const pdf = displayToPdf(x, y, w, h)
  const newPlacement = { pageIndex, x: pdf.x, y: pdf.y, width: pdf.w, height: pdf.h }
  if (existing >= 0) {
    placements.value = placements.value.slice(0, existing).concat([newPlacement], placements.value.slice(existing + 1))
  } else {
    placements.value = [...placements.value, newPlacement].sort((a, b) => a.pageIndex - b.pageIndex)
  }
}

function startDrag(e) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  dragStart = {
    startX: e.clientX - rect.left,
    startY: e.clientY - rect.top,
    boxX: boxDisplayX.value,
    boxY: boxDisplayY.value
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!dragStart || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const dx = e.clientX - rect.left - dragStart.startX
  const dy = e.clientY - rect.top - dragStart.startY
  let x = dragStart.boxX + dx
  let y = dragStart.boxY + dy
  const w = boxDisplayW.value
  const h = boxDisplayH.value
  x = Math.max(0, Math.min(x, canvasWidth.value - w))
  y = Math.max(0, Math.min(y, canvasHeight.value - h))
  boxDisplayX.value = x
  boxDisplayY.value = y
  dragStart.startX = e.clientX - rect.left
  dragStart.startY = e.clientY - rect.top
  dragStart.boxX = x
  dragStart.boxY = y
}

function stopDrag() {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  dragStart = null
}

function startResizeWidth(e) {
  e.stopPropagation()
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  resizeStart = {
    startX: e.clientX - rect.left,
    startW: boxDisplayW.value,
    boxX: boxDisplayX.value
  }
  document.addEventListener('mousemove', onResizeWidth)
  document.addEventListener('mouseup', stopResizeWidth)
}

function onResizeWidth(e) {
  if (!resizeStart || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const cursorX = e.clientX - rect.left
  const dw = cursorX - resizeStart.startX
  let w = Math.max(60, resizeStart.startW + dw)
  w = Math.min(w, canvasWidth.value - boxDisplayX.value)
  boxDisplayW.value = w
}

function stopResizeWidth() {
  document.removeEventListener('mousemove', onResizeWidth)
  document.removeEventListener('mouseup', stopResizeWidth)
  resizeStart = null
}

function removePlacementForCurrentPage() {
  const pageIndex = selectedPage.value - 1
  placements.value = placements.value.filter(p => p.pageIndex !== pageIndex)
  const d = pdfToDisplay(DEFAULT_PDF_BOX.x, DEFAULT_PDF_BOX.y, DEFAULT_PDF_BOX.width, DEFAULT_PDF_BOX.height)
  boxDisplayX.value = d.x
  boxDisplayY.value = d.y
  boxDisplayW.value = d.w
  boxDisplayH.value = d.h
}

async function onFormTypeChange() {
  await fetchPdf()
  await loadPlacement()
}

async function savePlacement() {
  const pageIndex = selectedPage.value - 1
  let nextPlacements = placements.value.filter(p => p.pageIndex !== pageIndex)
  if (hasPlacementOnCurrentPage.value) {
    const w = Math.max(1, boxDisplayW.value)
    const h = Math.max(1, boxDisplayH.value)
    const pdf = displayToPdf(boxDisplayX.value, boxDisplayY.value, w, h)
    const entry = { pageIndex, x: Math.round(pdf.x * 10) / 10, y: Math.round(pdf.y * 10) / 10, width: Math.round(pdf.w * 10) / 10, height: Math.round(pdf.h * 10) / 10 }
    nextPlacements = [...nextPlacements, entry].sort((a, b) => a.pageIndex - b.pageIndex)
  }

  saving.value = true
  saveMessage.value = ''
  try {
    await api.put('/admin/settings/signature-placement', {
      formType: selectedFormType.value,
      placements: nextPlacements
    })
    placements.value = nextPlacements
    saveMessage.value = `Placement saved for ${selectedFormType.value}.`
    saveSuccess.value = true
    emit('saved')
  } catch (err) {
    saveMessage.value = err.response?.data?.error || 'Failed to save placement.'
    saveSuccess.value = false
  } finally {
    saving.value = false
  }
}

watch(() => props.formTypeLock, (newVal) => {
  if (newVal && selectedFormType.value !== newVal) {
    selectedFormType.value = newVal
    onFormTypeChange()
  }
})

onMounted(async () => {
  if (props.formTypeLock) selectedFormType.value = props.formTypeLock
  await fetchPdf()
  await loadPlacement()
})
</script>
