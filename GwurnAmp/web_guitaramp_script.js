// The route :
// Channel Selector
// Overdrive
// Distortion
// Amp
// AmpSim(Cab)
// Chorus
// Reverb
// Delay
// Tremolo

const pan = document.getElementById('pan');
const mono_stereo_toggle = document.getElementById('mono_stereo_toggle')
const overdrive_toggle = document.getElementById('overdrive_toggle')

// console.log(mono_stereo_toggle)
const driveAmountKnob = document.getElementById('driveAmount');
const driveKnob = document.getElementById('drive');
const volume = document.getElementById('volume');

const bass = document.getElementById('bass');
const mid = document.getElementById('mid');
const treble = document.getElementById('treble');

const threshold = document.getElementById('threshold');
const ratio = document.getElementById('ratio');
const attack = document.getElementById('attack');
const release = document.getElementById('release');

const reverbWetDry = document.getElementById('reverbWetDry');

const visualizer = document.getElementById('visualizer');
const fftsize = 2048;


const audioCtx = new AudioContext()



const analyserNode = new AnalyserNode(audioCtx, {fftSize: fftsize})

//input_pan

// const toMono_state = 0;

var gainNodeL = audioCtx.createGain();
var gainNodeR = audioCtx.createGain();
var splitter = audioCtx.createChannelSplitter(2);
var merger = audioCtx.createChannelMerger(2);

var gainMono = audioCtx.createGain();
var gainStereo = audioCtx.createGain();
const gainMonoNode = new GainNode(audioCtx, {gain: volume.value})
const gainStereoNode = new GainNode(audioCtx, {gain: volume.value})

var gainOverdriveWet = audioCtx.createGain();
var gainOverdriveDry = audioCtx.createGain();
const gainOverdriveWetNode = new GainNode(audioCtx, {gain: 0})
const gainOverdriveDryNode = new GainNode(audioCtx, {gain: volume.value})

var reverbWet = audioCtx.createGain();
var reverbDry = audioCtx.createGain();
const reverbWetNode = new GainNode(audioCtx, {gain: volume.value})
const reverbDryNode = new GainNode(audioCtx, {gain: volume.value})

const oscTremolo = audioCtx.createOscillator();
oscTremolo.frequency.value = 2;
const TremoloAmpDepth = audioCtx.createGain();
TremoloAmpDepth.gain = 0.001; 
const TremoloNode = audioCtx.createGain();
oscTremolo.connect(TremoloAmpDepth);
TremoloAmpDepth.connect(TremoloNode);
oscTremolo.start(0);

// start alert
alert('小心！如果直接進入會大聲feedback，請設定你電腦的輸入為你的錄音介面')

// toggles
function overdrive_on(){
    if (overdrive_toggle.checked){
        console.log('overdrive_on')
        gainOverdriveWetNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainOverdriveDryNode.gain.setValueAtTime(0, audioCtx.currentTime);
    }
    else if (!overdrive_toggle.checked){
        console.log('overdrive_off')
        gainOverdriveWetNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainOverdriveDryNode.gain.setValueAtTime(1, audioCtx.currentTime);

    }
}
function toStereo(){
    if (mono_stereo_toggle.checked){
        console.log('toStereo')
        console.log(mono_stereo_toggle.checked)
        gainMonoNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainStereoNode.gain.setValueAtTime(1, audioCtx.currentTime);
    }
    else if (!mono_stereo_toggle.checked){

        console.log('toMono')
        console.log(mono_stereo_toggle.checked)
        gainMonoNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainStereoNode.gain.setValueAtTime(0, audioCtx.currentTime);

    }
}


// const panNode = new StereoPannerNode(audioCtx);
var panNode = audioCtx.createPanner();
//AmpSim

const getImpulseBuffer = (audioCtx, impulseUrl) => {
    return fetch(impulseUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
}

const convolver = audioCtx.createConvolver()
async function ampSimInit(){
    convolver.buffer = await getImpulseBuffer(audioCtx, 'amp-ir-pack/ir_test.wav')
}
ampSimInit()


//------Effects

function makeDistortionCurve(amount) {
    let k = typeof amount === 'number' ? amount : 50,
    //   n_samples = 44100,
      n_samples = 256,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for ( ; i < n_samples; ++i ) {
        
      x = i * 2 / n_samples - 1;
        if(i<n_samples/2){
            curve[i] = x;
        }
        else{
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) )
        }
    // curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) )

    }
    return curve
};

const driveGain = new GainNode(audioCtx, {gain: volume.value})

const distortionNode = audioCtx.createWaveShaper();
distortionNode.oversample = '4x';
distortionNode.curve = makeDistortionCurve(400);

const gainNode = new GainNode(audioCtx, {gain: volume.value})
const bassEQ = new BiquadFilterNode(audioCtx, {
    type: 'lowshelf',
    frequency:500,
    gain: bass.value
})
const midEQ = new BiquadFilterNode(audioCtx, {
    type: 'peaking',
    Q: Math.SQRT1_2,
    frequency:1500,
    gain: mid.value
})
const trebleEQ = new BiquadFilterNode(audioCtx, {
    type: 'highshelf',
    frequency:3000,
    gain: treble.value
})
// Create a compressor node
var compressor = audioCtx.createDynamicsCompressor();
compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
compressor.knee.setValueAtTime(40, audioCtx.currentTime);
compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
compressor.attack.setValueAtTime(0, audioCtx.currentTime);
compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

//------Routes
setupEventListeners()
setupContext()
resize()
drawVisualizer()


//------Set Listeners
function setupEventListeners(){
    
    
    window.addEventListener('resize',resize)
    // pan.addEventListener('input', e => {
    //     const value = parseInt(e.target.value) // to get the value from gui
    //     console.log(value);
    //     panNode.setPosition(value,0,0);
    //     // panNode.pan.setValueAtTime(value, audioCtx.currentTime,.01);
    // })
    driveAmountKnob.addEventListener('input', e => {
        const value = parseFloat(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        
        distortionNode.curve = makeDistortionCurve(value);    
    })

    driveKnob.addEventListener('input', e => {
        const value = parseFloat(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        
        driveGain.gain.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    })
    volume.addEventListener('input', e => {
        const value = parseFloat(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        gainNode.gain.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume

    })
    bass.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        bassEQ.gain.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    })
    mid.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        midEQ.gain.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    })
    treble.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        trebleEQ.gain.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    })
    threshold.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        compressor.threshold.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    })
    ratio.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        compressor.ratio.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    })
    attack.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        compressor.attack.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    })
    release.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        compressor.release.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    })

    reverbWetDry.addEventListener('input', e => {
        const value = parseFloat(e.target.value) // to get the value from gui

        reverbWetNode.gain.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
        reverbDryNode.gain.setTargetAtTime(1-value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
        // console.log(reverbWetNode.gain.value)
        // console.log(reverbDryNode.gain.value)
    })
    
    
}

//------Reverb
const reverbConvolver = audioCtx.createConvolver()
async function reverbInit(reverbFile){
    reverbConvolver.buffer = await getImpulseBuffer(audioCtx, reverbFile)
}
reverbInit('reverb-ir-file/Nice Drum Room.wav')

function selectReverb(selectObject) {
    var value = selectObject.value;  

    if (value=="room"){
        console.log(value);
        reverbInit('reverb-ir-file/Nice Drum Room.wav')
    }
    else if (value=="spring"){
        console.log(value);
        reverbInit('reverb-ir-file/Conic Long Echo Hall.wav')
    }
    else if (value=="hall"){
        console.log(value);
        reverbInit('reverb-ir-file/Nice Drum Room.wav')
    }
}




//------Audio route
async function setupContext(){
    const guitar = await getGuitar()
    // to avoid google limitation of audio device
    if(audioCtx.state === 'suspended'){
        await audioCtx.resume();
    }


    const source = audioCtx.createMediaStreamSource(guitar)

    // const mono_stereo_toggle = document.getElementById('mono_stereo_toggle');
    

    source.connect(gainMonoNode);
    source.connect(gainStereoNode);
    

    //mono
    gainMonoNode.connect(gainNodeL, 0);
    splitter.connect(gainNodeR, 1);
    
    gainNodeL.connect(merger, 0, 0);
    gainNodeL.connect(merger, 0, 1);
    merger.connect(driveGain)

    //stereo
    gainStereoNode.connect(driveGain);

    //overdrive_on
    driveGain
        .connect(distortionNode)
        .connect(gainOverdriveWetNode)
        .connect(bassEQ)
    //overdrive_off
    driveGain
        .connect(gainOverdriveDryNode)
        .connect(bassEQ)
        
    bassEQ
        .connect(midEQ)
        .connect(trebleEQ)

        .connect(convolver)

        .connect(gainNode)
        .connect(compressor)
        
        .connect(analyserNode)

    //reverb
    analyserNode.connect(reverbConvolver).connect(reverbWetNode)
    analyserNode.connect(reverbDryNode)
    
    
    // reverbWetNode.connect(TremoloNode)
    // reverbDryNode.connect(TremoloNode)

    // TremoloNode

    reverbWetNode.connect(audioCtx.destination)
    reverbDryNode
        .connect(audioCtx.destination) //destination = speaker of ur computer , often be the last node to connect!

}
//------Guitar input
function getGuitar(){
    return navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSupression: false,
            latency : 0
        }
    })
}
//------Visualizer
function drawVisualizer(){
    requestAnimationFrame(drawVisualizer)

    const bufferLength = analyserNode.frequencyBinCount // how many bins
    // console.log(bufferLength) //128
    const dataArray = new Uint8Array(bufferLength)
    analyserNode.getByteFrequencyData(dataArray)

    const width = visualizer.width
    const height = visualizer.height
    console.log(height)
    const barWidth = width/bufferLength

    const canvasContext = visualizer.getContext('2d')
    canvasContext.clearRect(0,0,width,height)

    dataArray.forEach((item,index)=>{
        const y = item/255 * height
        // const x = barWidth*index 
        const x = 1000*Math.log10(index)   

        //draw
        canvasContext.fillStyle = `hsl(${(y/height)*200+200},50%,50%)` // hue saturation lightness
        canvasContext.fillRect(x, (height-y)/2, barWidth/3, y/2)

    })
}

function resize(){ // change the bar into high resolution  
    visualizer.width = visualizer.clientWidth * window.devicePixelRatio
    visualizer.height = visualizer.clientHeight * window.devicePixelRatio
} 