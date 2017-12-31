<template>
  <section class="section">
    <div class="container">
      <div class="tabs is-boxed">
        <ul>
          <li v-for="(file, i) in files" :key="i" 
              :class="{'is-active': activeFile === i}">
            <a @click="selectFile(i)">{{file.name}}</a>
          </li>
          <li><a @click="addFile">
            <span class="icon has-text-primary">
              <i class="fa fa-plus"></i>
            </span>
          </a></li>
        </ul>
      </div>
      <p class="field">
        <a @click="toggleRecord" class="button is-primary">
          <i v-if="recording" class="fa fa-stop" aria-hidden="true"></i>
          <i v-else class="fa fa-microphone" aria-hidden="true"></i>
        </a>
        <a v-if="!recording" @click="clear" class="button is-danger">Clear</a>
        <span class="select">
          <select v-model="visualizerMode">
            <option value="sinewave">Wave Form</option>
            <option value="frequencybars">Frequency Spectrum</option>
          </select>
        </span>
        <audio-visualizer v-if="recording" :analyser="analyser"
          :mode="visualizerMode"
          :width="200" :height="36"></audio-visualizer>
      </p>
      <div class="editor">
        <div class="last-transcript"></div>
        <div class="panel">
          <a v-for="(utterance, i) in files[activeFile].utterances" :key="i" class="panel-block">
            {{ utterance | formatResult }}
          </a>
          <a v-if="files[activeFile].utterances.length === 0" class="panel-block has-text-grey">
            Transcritions will be shown here
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { recognizeMic } from '@/apis/watson-api'
import AudioVisualizer from '@/components/AudioVisualizer'

export default {
  components: { AudioVisualizer },
  data () {
    return {
      files: [],
      recording: false,
      activeFile: 0,
      recognizeStream: null,
      analyser: null,
      audioCtx: null,
      visualizerMode: 'sinewave',
      resultIndexOffset: 0,
      nextFileNumber: 1
    }
  },
  created () {
    this.addFile()
  },
  mounted () {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioCtx = new AudioContext()
  },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    },
    clear () {
      this.files[this.activeFile].utterances = []
    },
    toggleRecord () {
      if (this.recording) {
        this.stopRecording()
      } else {
        this.startRecording()
      }
    },
    startRecording () {
      this.recording = true
      this.resultIndexOffset = this.files[this.activeFile].utterances.length
      navigator.mediaDevices.getUserMedia({ audio: true }).then(audioStream => {
        const audioCtx = this.audioCtx
        const audioSource = audioCtx.createMediaStreamSource(audioStream)
        const analyser = audioCtx.createAnalyser()
        audioSource.connect(analyser)
        this.analyser = analyser

        return recognizeMic({
          resultsBySpeaker: true,
          model: 'ja-JP_BroadbandModel',
          mediaStream: audioStream,
          continuous: false,
          keywords: ['改行', 'こんにちは'],
          keywords_threshold: 0.6,
          interim_results: true
        })
      }).then(stream => {
        this.recognizeStream = stream
        stream.on('data', (e) => this.onData(e))
        stream.on('close', () => { this.recording = false })
        stream.on('error', (err) => {
          console.error(err)
        })
      }).catch(err => {
        console.error(err)
      })
    },
    onData (e) {
      console.log(e)
      if (e.result_index !== undefined && e.results) {
        const index = this.resultIndexOffset + e.result_index
        this.files[this.activeFile].utterances.splice(index, 1, e.results)
      }
    },
    stopRecording () {
      if (this.recognizeStream) this.recognizeStream.stop()
      this.recording = false
    },
    selectFile (index) {
      if (this.recording) return
      this.activeFile = index
    },
    addFile () {
      if (this.recording) return
      this.files.push(this.newFile())
      this.activeFile = this.files.length - 1
    },
    newFile () {
      const num = this.nextFileNumber
      this.nextFileNumber += 1
      return {name: 'File ' + num, utterances: []}
    }
  },
  filters: {
    formatResult (utterance) {
      if (Array.isArray(utterance)) {
        return utterance.map(r => r.alternatives[0].transcript).join('')
      } else {
        return 'Format error'
      }
    }
  }
}
</script>

<style>

</style>
