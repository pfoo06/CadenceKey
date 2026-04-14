class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {

        return true;
    }
}

registerProcessor('audioProcessing', AudioProcessor);
