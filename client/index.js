

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

function getDummyAudio(frequency, sampleRate, bufferSize, ){
    const buffer = new Float32Array(bufferSize);
    for(let i =0; i < bufferSize;i++){
        let time = i/sampleRate;
        buffer[i]= Math.sin(2* Math.PI * frequency * time)
    }
    return buffer;
}












