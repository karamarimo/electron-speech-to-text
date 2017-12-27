<template>
  <section class="section">
    <div class="container">
      <div class="container is-fullhd level">
        <div class="level-left">
          <a @click="toggleRecord" class="button is-primary level-item">
            {{ recording ? 'Stop' : 'Start'}}
          </a>
        </div>
        <div class="level-right">
          <a @click="clear" class="button is-danger level-item">Clear</a>
        </div>
      </div>
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
      <div class="editor">
        <textarea v-model="files[activeFile].text"
          class="textarea" placeholder="transcription will be shown here"></textarea>
      </div>
    </div>
  </section>
</template>

<script>
import { recognizeStream } from '@/apis/watson-api'
import * as mic from 'mic'
import * as wav from 'wav'

export default {
  data () {
    return {
      files: [{name: 'New File', text: ''}],
      recording: false,
      activeFile: 0,
      micInstance: null,
      recognizeStream: null,
      micConfig: {
        rate: '16000',
        channels: '1',
        fileType: 'raw'
      }
    }
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

      this.micInstance = mic(this.micConfig)
      const wavStream = new wav.Writer({
        sampleRate: parseInt(this.micConfig.rate),
        channels: parseInt(this.micConfig.channels)
      })
      // const recStream = recognizeStream(stream)
      const recStream = recognizeStream(wavStream)
      const stream = this.micInstance.getAudioStream()
      stream.pipe(wavStream)
      // wavStream.on('data', (data) => console.log(data))

      recStream.on('data', (event) => this.recCallback(null, 'data', event))
      recStream.on('error', (event) => this.recCallback(event))
      recStream.on('close', (event) => this.recCallback(null, 'close', event))
      // recStream.pipe(process.stdout)
      this.micInstance.start()
    },
    recCallback (err, type, event) {
      if (err) {
        console.error(err)
        if (this.recording) this.stopRecording()
        return
      }
      if (type === 'close') {
        console.log('connection closed')
        if (this.recording) this.stopRecording()
        return
      }
      if (event.result_index) {
        console.log('index: ' + event.result_index)
        for (let result of event.results || []) {
          console.log(result.alternatives[0].transcript, result.final)
        }
      }
      if (event.speaker_labels) {
        console.log(event.speaker_labels)
      }
    },
    stopRecording () {
      this.micInstance.stop()
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
    }
  }
}
</script>

<style>

</style>
