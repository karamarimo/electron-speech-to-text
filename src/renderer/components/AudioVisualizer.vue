<template>
  <canvas ref="canvas" :width="width" :height="height"></canvas>
</template>

<script>
export default {
  props: {
    width: Number,
    height: Number,
    analyser: AnalyserNode,
    mode: {
      type: String,
      default: 'sinewave'
    }
  },
  data () {
    return {
      canvasCtx: null,
      drawVisual: null
    }
  },
  mounted () {
    this.canvasCtx = this.$refs.canvas.getContext('2d')
  },
  watch: {
    analyser (val) {
      if (this.drawVisual) cancelAnimationFrame(this.drawVisual)
      if (val) {
        this.visualize(val, this.mode)
      }
    },
    mode (val) {
      if (this.drawVisual) cancelAnimationFrame(this.drawVisual)
      if (val) {
        this.visualize(this.analyser, val)
      }
    }
  },
  methods: {
    visualize (analyser, mode) {
      const canvasCtx = this.canvasCtx
      analyser.minDecibels = -90
      analyser.maxDecibels = -30
      analyser.smoothingTimeConstant = 0.85

      if (mode === 'sinewave') {
        analyser.fftSize = 2048
        const bufferLength = analyser.fftSize
        console.log(bufferLength)
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
          this.drawVisual = requestAnimationFrame(draw)

          analyser.getByteTimeDomainData(dataArray)

          canvasCtx.clearRect(0, 0, this.width, this.height)

          canvasCtx.lineWidth = 2
          canvasCtx.strokeStyle = '#00d1b2'

          canvasCtx.beginPath()

          const sliceWidth = this.width * 1.0 / bufferLength
          let x = 0

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0
            const y = v * this.height / 2

            if (i === 0) {
              canvasCtx.moveTo(x, y)
            } else {
              canvasCtx.lineTo(x, y)
            }

            x += sliceWidth
          }

          canvasCtx.lineTo(this.width, this.height / 2)
          canvasCtx.stroke()
        }

        draw()
      } else if (mode === 'frequencybars') {
        analyser.fftSize = 256
        const bufferLengthAlt = analyser.frequencyBinCount
        console.log(bufferLengthAlt)
        const dataArrayAlt = new Uint8Array(bufferLengthAlt)

        const draw = () => {
          this.drawVisual = requestAnimationFrame(draw)

          analyser.getByteFrequencyData(dataArrayAlt)

          canvasCtx.clearRect(0, 0, this.width, this.height)

          const barWidth = (this.width / bufferLengthAlt) * 2.5
          let x = 0

          for (let i = 0; i < bufferLengthAlt; i++) {
            const barHeight = dataArrayAlt[i] / 256 * this.height
            canvasCtx.fillStyle = '#00d1b2'
            canvasCtx.fillRect(x, this.height - barHeight, barWidth, barHeight)

            x += barWidth + 1
          }
        }

        draw()
      } else if (mode === 'off') {
        canvasCtx.clearRect(0, 0, this.width, this.height)
        canvasCtx.fillStyle = 'red'
        canvasCtx.fillRect(0, 0, this.width, this.height)
      }
    }
  }
}
</script>

<style>

</style>
