const watson = require('watson-developer-cloud')
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1')
const credentails = require('../../../credentials.json')
const recognizeMicrophone = require('watson-speech/speech-to-text/recognize-microphone')

const service = new SpeechToTextV1(credentails)
const authService = new watson.AuthorizationV1(credentails)

export function recognizeStream (stream, params = {}) {
  const defaultParams = {
    model: 'ja-JP_BroadbandModel',
    'content_type': 'audio/wav',
    'interim_results': true,
    'max_alternatives': 3,
    'word_confidence': false,
    speaker_labels: false,
    timestamps: false,
    objectMode: true
  }

  const mergedParams = Object.assign(defaultParams, params)
  const recognizeStream = service.createRecognizeStream(mergedParams)
  console.log(mergedParams)
  stream.pipe(recognizeStream)
  return recognizeStream
}

export function recognizeMic (params) {
  return new Promise((resolve, reject) => {
    authService.getToken({
      url: watson.SpeechToTextV1.URL
    }, (err, token) => {
      if (err) {
        reject(err)
        return
      }
      resolve(recognizeMicrophone({ token, ...params }))
    })
  })
}
