

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
let userHigh = null;
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

    userLow = null;
    userHigh = null;
    document.getElementById('results').style.display = "none";

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
        userLow = FreqToNote(finalHz);
        console.log(userLow)
    }else if(targetNote === "High"){
        userHigh = FreqToNote(finalHz);
        console.log(userHigh)
    }

    let range = ""
    if (userLow !== null && userHigh !== null){
        outputResult(userLow.name,userHigh.name);

    }
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
    let pThreshold = maxval * 0.7;
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
        let absoluteNumber = halfStepToA + 69;
        let noteIndex = absoluteNumber % 12;
        let octave = Math.floor(absoluteNumber /12)-1;
        return{name : noteNames[noteIndex] + octave, midi : absoluteNumber}
}

function calcVoiceType(lowMidi,highMidi){
        let voiceType = "unknown";
        
        let bassDistance = Math.sqrt(Math.pow((lowMidi-36),2)+ Math.pow((highMidi-64),2))
        let bariDistance = Math.sqrt(Math.pow((lowMidi-43),2)+ Math.pow((highMidi-67),2))
        let tenDistance = Math.sqrt(Math.pow((lowMidi-48),2)+ Math.pow((highMidi-72),2))
        let altDistance = Math.sqrt(Math.pow((lowMidi-53),2)+ Math.pow((highMidi-77),2))
        let mezzoDistance = Math.sqrt(Math.pow((lowMidi-57),2)+ Math.pow((highMidi-81),2))
        let sopDistance = Math.sqrt(Math.pow((lowMidi-60),2)+ Math.pow((highMidi-84),2))

        if(Math.min(bassDistance,bariDistance,tenDistance,altDistance,mezzoDistance,sopDistance)==bassDistance){
            voiceType = " a Bass";
        }else if(Math.min(bassDistance,bariDistance,tenDistance,altDistance,mezzoDistance,sopDistance)==bariDistance){
            voiceType = " a Baritone";
        }else if(Math.min(bassDistance,bariDistance,tenDistance,altDistance,mezzoDistance,sopDistance)==tenDistance){
            voiceType = "a Tenor";
        }else if(Math.min(bassDistance,bariDistance,tenDistance,altDistance,mezzoDistance,sopDistance)==altDistance){
            voiceType = "an Alto";
        }else if(Math.min(bassDistance,bariDistance,tenDistance,altDistance,mezzoDistance,sopDistance)==mezzoDistance){
            voiceType = "a Mezzo-Soprano";
        }else if(Math.min(bassDistance,bariDistance,tenDistance,altDistance,mezzoDistance,sopDistance)==sopDistance){
            voiceType = "a Soprano";        
        }else {voiceType ="weird"}

        console.log(voiceType);
        return voiceType;

}

function outputResult(lowNote,highNote){
    range = calcVoiceType(userLow.midi,userHigh.midi);
    console.log(range);
    resultPage = document.getElementById('results')
    resultPage.innerHTML = `
    <h1>You are ... ${range}!</h1> 
    <h2>Your lowest note is a ${lowNote} and your highest note is a ${highNote}</h2>`;

    resultPage.style.display = "block";


}

