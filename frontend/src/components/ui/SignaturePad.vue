<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
      <span class="ml-1 text-xs text-red-600" v-if="required">(Required)</span>
      <span v-if="modelValue" class="ml-1 text-xs text-green-600">(Signed)</span>
    </label>
    <p v-if="description" class="text-xs text-gray-500 mb-1">{{ description }}</p>

    <!-- Type name instead toggle -->
    <div class="mb-2 flex gap-4">
      <label class="inline-flex items-center text-sm text-gray-700">
        <input type="radio" :checked="!useTypedName" value="draw" @change="useTypedName = false" class="rounded border-gray-300 text-primary focus:ring-primary" />
        <span class="ml-2">Draw signature</span>
      </label>
      <label class="inline-flex items-center text-sm text-gray-700">
        <input type="radio" :checked="useTypedName" value="type" @change="useTypedName = true" class="rounded border-gray-300 text-primary focus:ring-primary" />
        <span class="ml-2">Type name instead</span>
      </label>
    </div>

    <!-- Draw mode: canvas -->
    <div v-show="!useTypedName" class="border-2 border-dashed border-gray-300 rounded-md overflow-hidden bg-white">
      <canvas
        ref="canvasRef"
        class="block w-full touch-none cursor-crosshair"
        :width="width"
        :height="height"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart.prevent="startDrawTouch"
        @touchmove.prevent="drawTouch"
        @touchend.prevent="endDraw"
      />
      <div class="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <p class="text-xs text-gray-500">Draw your signature above</p>
        <button
          type="button"
          @click="clearCanvas"
          class="text-sm text-gray-600 hover:text-gray-900 underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Type mode: input -->
    <div v-show="useTypedName" class="space-y-2">
      <input
        v-model="typedName"
        type="text"
        placeholder="Type your full legal name"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
        @input="emitTypedSignature"
      />
      <p class="text-xs text-gray-500">Your typed name will be used as your signature on the form.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Signature' },
  description: String,
  required: { type: Boolean, default: true },
  /** v-model: signature data URL (base64 PNG) */
  modelValue: { type: String, default: null },
  /** Initial base64 PNG (e.g. from draft) to display on canvas */
  initialImage: { type: String, default: null },
  width: { type: Number, default: 400 },
  height: { type: Number, default: 120 }
})

const emit = defineEmits(['update:modelValue'])

const canvasRef = ref(null)
const useTypedName = ref(false)
const typedName = ref('')

let drawing = false
let lastX = 0
let lastY = 0

function getCtx() {
  const canvas = canvasRef.value
  if (!canvas) return null
  return canvas.getContext('2d')
}

function setupCanvas() {
  const ctx = getCtx()
  if (!ctx) return
  ctx.strokeStyle = '#111827'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function emitFromCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = getCtx()
  if (!ctx) return
  const blank = document.createElement('canvas')
  blank.width = canvas.width
  blank.height = canvas.height
  const blankCtx = blank.getContext('2d')
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const hasStroke = pixelData.some((_, i) => i % 4 === 3 && pixelData[i] > 0)
  if (!hasStroke) {
    emit('update:modelValue', null)
    return
  }
  const dataUrl = canvas.toDataURL('image/png')
  emit('update:modelValue', dataUrl)
}

function clearCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = getCtx()
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  emit('update:modelValue', null)
}

function startDraw(e) {
  drawing = true
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  lastX = (e.clientX - rect.left) * scaleX
  lastY = (e.clientY - rect.top) * scaleY
}

function draw(e) {
  if (!drawing) return
  const ctx = getCtx()
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(x, y)
  ctx.stroke()
  lastX = x
  lastY = y
}

function endDraw() {
  if (drawing) {
    drawing = false
    emitFromCanvas()
  }
}

function startDrawTouch(e) {
  if (e.touches.length) {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    lastX = (e.touches[0].clientX - rect.left) * scaleX
    lastY = (e.touches[0].clientY - rect.top) * scaleY
    drawing = true
  }
}

function drawTouch(e) {
  if (!drawing || !e.touches.length) return
  const ctx = getCtx()
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.touches[0].clientX - rect.left) * scaleX
  const y = (e.touches[0].clientY - rect.top) * scaleY
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(x, y)
  ctx.stroke()
  lastX = x
  lastY = y
}

function emitTypedSignature() {
  if (!typedName.value || !typedName.value.trim()) {
    emit('update:modelValue', null)
    return
  }
  renderTypedNameToDataUrl(typedName.value.trim()).then((dataUrl) => {
    emit('update:modelValue', dataUrl)
  })
}

function renderTypedNameToDataUrl(name) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 80
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      resolve(null)
      return
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#111827'
    ctx.font = 'italic 32px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(name, 20, 40)
    resolve(canvas.toDataURL('image/png'))
  })
}

watch(
  () => props.initialImage,
  (url) => {
    if (!url) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.value
      if (!canvas || !img.width) return
      const ctx = getCtx()
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1)
      const w = img.width * scale
      const h = img.height * scale
      const x = (canvas.width - w) / 2
      const y = (canvas.height - h) / 2
      ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h)
    }
    img.src = url.startsWith('data:') ? url : `data:image/png;base64,${url}`
  },
  { immediate: true }
)

onMounted(() => {
  setupCanvas()
  if (props.initialImage && !useTypedName.value) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.value
      if (!canvas || !img.width) return
      const ctx = getCtx()
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1)
      const w = img.width * scale
      const h = img.height * scale
      const x = (canvas.width - w) / 2
      const y = (canvas.height - h) / 2
      ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h)
    }
    img.src = props.initialImage.startsWith('data:') ? props.initialImage : `data:image/png;base64,${props.initialImage}`
  }
})

// Expose for parent
defineExpose({
  getValue: () => props.modelValue,
  clear: () => {
    clearCanvas()
    typedName.value = ''
  }
})
</script>
