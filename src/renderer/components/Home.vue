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
        <a @click="clear" class="button is-danger">Clear</a>
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

export default {
  data () {
    return {
      files: [{name: 'New File', text: ''}],
      recording: false,
      activeFile: 0,
      recognizeStream: null
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

      recognizeMic({
        outputElement: '.transcription',
        resultsBySpeaker: true,
        model: 'ja-JP_BroadbandModel'
      }).then(stream => {
        this.recognizeStream = stream
        stream.on('data', (e) => this.onData(e))
        stream.on('close', () => { this.recording = false })
        stream.on('error', (err) => {
          console.error(err)
        })
      }).catch(err => {
        console.error(err)
        alert('Failed to connect to Watson.')
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
      this.recognizeStream.stop()
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
