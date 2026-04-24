

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
const recordLowButton = document.getElementById('recLBtn');
const recordHighButton = document.getElementById('recHBtn');

let isRecording = false;
let pitchBucket = [];
let userLow = null;
let UserHigh = null;
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
recordLowButton.addEventListener('click',() => {
    pitchBucket = [];
    isRecording = true;
    setTimeout(()=>{
        isRecording = false;
        finalizeNote("Low")},1000)

})
recordHighButton.addEventListener('click',() => {
    pitchBucket = [];
    isRecording = true;
    setTimeout(()=>{
        isRecording = false;
        finalizeNote("High")},1000)

})


function getDummyAudio(frequency, sampleRate, bufferSize, ){
    const buffer = new Float32Array(bufferSize);
    for(let i =0; i < bufferSize;i++){
        let time = i/sampleRate;
        buffer[i]= Math.sin(2* Math.PI * frequency * time)
    }
    return buffer;
}
function finalizeNote(targetNote){
    if (pitchBucket.length === 0){
        console.log("error")
        return
    }
    pitchBucket.sort((a,b) => a-b)
    
    let finalHz = pitchBucket[Math.floor(pitchBucket.length / 2)]
    console.log(finalHz);
    if (targetNote === "Low"){
        userLow = FreqToNote(finalHz).midi;
        userLow = FreqToNote(finalHz).name;
        console.log(userLow)
    }else if(targetNote === "High"){
        userHigh = FreqToNote(finalHz).midi
        userHigh = FreqToNote(finalHz).name;
        console.log(userHigh)
    }
    if (userLow && userHigh !== null){calcVoiceType(userLow,userHigh)}
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
function FreqToNote(frequency){
        if(frequency === -1|| frequency===Infinity||isNaN(frequency)){return{name:"--",midi:0}}
        let halfStepToA = Math.round(12*Math.log2(frequency/440));
        const noteNames =["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
        let absoluteNumber = halfStepToA + 57;
        let noteIndex = absoluteNumber % 12;
        let octave = Math.floor(absoluteNumber /12);
        return{name : noteNames[noteIndex] + octave, midi : absoluteNumber}
}
function calcVoiceType(lowMidi,highMidi){
        let voiceType = "unknown";

        if( lowMidi >= 36 && highMidi <=64){
            voiceType = "Bass";
        }else if( lowMidi >= 43 && highMidi <=67){
            voiceType = "Baritone";
        }else if( lowMidi >= 48 && highMidi <=72){
            voiceType = "Tenor";
        }else if( lowMidi >= 53 && highMidi <=77){
            voiceType = "Alto";
        }else if( lowMidi >= 57 && highMidi <=81){
            voiceType = "Mezzo-Soprano";
        }else if( lowMidi >= 60 && highMidi <=84){
            voiceType = "Soprano";
        }else {voiceType ="weird"}
        console.log(voiceType)
        return voiceType
}

