

const views = {landing : document.getElementById('landing-view'), gallery : document.getElementById('gallery-view')};
const entryBtn = document.getElementById('entryBtn');


const  cadenceKeyLogo = document.getElementById('homeLogo');
const infoLink = document.getElementById('infoLink');
function switchView (viewID) {
    Object.values(views).forEach(div => {div.classList.add('hidden')});
    views[viewID].classList.remove('hidden');
}
function showView(viewID) {
    views[viewID].classList.remove('hidden');
}
function hideView(viewID) {
    views[viewID].classList.add('hidden');
}

entryBtn.addEventListener('click',() => {switchView('gallery');})

cadenceKeyLogo.addEventListener('click',(e) => {
    e.preventDefault();
    switchView('landing');

})
infoLink.addEventListener('click',(e) => {
    e.preventDefault();
    switchView('info');

})

// capturing audio

const startButton = document.getElementById('startBtn');
const stopButton = document.getElementById('stopBtn');
const recordButton = document.getElementById('recBtn');

let isRecording = false;
let pitchBucket = [];
let audioContext;
let micStream
let sourceNode;
let audioWorkletNode;
let analyser;


startButton.addEventListener('click', async() => {
    //checking if browser support the APIS
    if (!window.AudioContext||!window.MediaStreamAudioSourceNode||!window.AudioWorkletNode){
        alert('Browser does not support APIs required')
        return;
    }

    //requesting mic permission
    micStream = await navigator.mediaDevices.getUserMedia({audio: true});

    //opening audio stream
    audioContext = new AudioContext();
    sourceNode = audioContext.createMediaStreamSource(micStream);

    //
    await audioContext.audioWorklet.addModule('audioProcessing.js');
    audioWorkletNode = new AudioWorkletNode(audioContext,'audioProcessing');
    sourceNode.connect(audioWorkletNode);
    audioWorkletNode.port.onmessage = (event) =>{
        let liveAudioBuffer = event.data;
        if (isRecording == true){
            let hz = autoCorrelate(liveAudioBuffer,audioContext.sampleRate);
            if (hz != -1){
                pitchBucket.push(hz)
            }
        }
    }
    console.log("recording started")

});

stopButton.addEventListener('click',() => {
    //closing audio stream
    micStream.getTracks().forEach(track => track.stop());
    audioContext.close();
    console.log("recording stopped.");

})
//record snippet
recordButton.addEventListener('click',() => {


})


function getDummyAudio(frequency, sampleRate, bufferSize, ){
    const buffer = new Float32Array(bufferSize);
    for(let i =0; i < bufferSize;i++){
        let time = i/sampleRate;
        buffer[i]= Math.sin(2* Math.PI * frequency * time)
    }
    return buffer;
}
function autoCorrelate(buffer, sampleRate){
    let size = buffer.length;
    let rms = 0;


    for(let i =0; i <size;i++){
        rms += buffer[i]* buffer[i];
    }
    rms = Math.sqrt(rms/size);
    if (rms < 0.01){return -1};


    let r1 = 0; let r2 = size-1; let threshold = 0.2;
    for(let i =0; i <size/2;i++){if(Math.abs(buffer[i]) < threshold){r1=i;break;}}
    for(let i =0; i <size/2;i++){if(Math.abs(buffer[size-i]) < threshold){r2=size-i;break;}}
    buffer = buffer.slice(r1,r2);
    size = buffer.length;

    let c = new Array(size).fill(0);
    for (let i = 0;i< size;i++){
        for(let j=0;j<size-i;j++){
            c[i] = c[i] + buffer[j] * buffer[i+j];
        }
    }

    let d = 0; while (c[d] > c[d+1]){d++};


    let maxval = -1,maxpos = -1;
    for(let i=d;i<size;i++){
        if(c[i] > maxval){
            maxval = c[i];
            maxpos = i;
        }
    }
    let pThreshold = maxval * 0.9;
    maxpos = -1;
    for (let i = d;i<size;i++){
        if (c[i] > pThreshold){
            maxpos = i;
            break;
        }
    }




    let T0 = maxpos
    let finalHz = sampleRate / T0
        return finalHz;











}

