class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {

        const input = inputs[0];
        if(input && input.length > 0){
            const channeldata = input[0];
            this.port.postMessage(channeldata);
        }
        return true;
    }
}

registerProcessor('audioProcessing', AudioProcessor);
