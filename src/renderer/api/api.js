const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');

class SpeechToTextAPI {
  constructor(credentails) {
    this._service = new SpeechToTextV1(credentails)
  }

  getModel() {
    const params = {
      model_id: 'ja-JP_BroadbandModel'
    }

    this._service.getModel(params, function(error, model) {
      if (error) {
        console.log('Error:', error)
      } else {
        console.log(JSON.stringify(model))
      }
    })
  }
}

export default SpeechToTextAPI
