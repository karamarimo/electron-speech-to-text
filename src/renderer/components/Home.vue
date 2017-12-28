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
            <option value="sinewave">Sine Wave</option>
            <option value="frequencybars">Frequency Bars</option>
          </select>
        </span>
        <audio-visualizer v-if="recording" :analyser="analyser"
          :mode="visualizerMode"
          :width="200" :height="30"></audio-visualizer>
      </p>
      <div class="editor">
        <div class="last-transcript"></div>
        <textarea v-model="files[activeFile].text"
          class="transcription textarea" placeholder="transcription will be shown here"></textarea>
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
      files: [{name: 'New File', text: ''}],
      recording: false,
      activeFile: 0,
      recognizeStream: null,
      analyser: null,
      audioCtx: null,
      visualizerMode: 'sinewave'
    }
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
      this.files[this.activeFile].text = ''
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
      navigator.mediaDevices.getUserMedia({ audio: true }).then(audioStream => {
        const audioCtx = this.audioCtx
        const audioSource = audioCtx.createMediaStreamSource(audioStream)
        const analyser = audioCtx.createAnalyser()
        audioSource.connect(analyser)
        this.analyser = analyser

        return recognizeMic({
          outputElement: '.transcription',
          resultsBySpeaker: true,
          model: 'ja-JP_BroadbandModel',
          mediaStream: audioStream
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
      if (e.transcript) {
        console.log(e.transcript)
      }
      if (e.data) {
        console.log(e.data)
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
      this.files.push({
        name: 'New File',
        text: ''
      })
      this.activeFile = this.files.length - 1
    }
  }
}
</script>

<style>

</style>
