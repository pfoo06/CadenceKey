

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

entryBtn.addEventListener('click',() => {switchView('gallery'); loadSkis();})

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
    console.log("recording started")

});

stopButton.addEventListener('click',() => {
    //closing audio stream
    micStream.getTracks().forEach(track => track.stop());
    audioContext.close();
    console.log("recording stopped.");

})









