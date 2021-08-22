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
const audioCtx = new AudioContext()


//----------Guitar input & total route
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
async function setupContext(){
    const guitar = await getGuitar()
    // to avoid google limitation of audio device
    if(audioCtx.state === 'suspended'){
        await audioCtx.resume();
    }

    const source = audioCtx.createMediaStreamSource(guitar);
    source
        .connect(InputSelectNodeIn).connect(InputSelectNodeOut)
        .connect(overdriveNodeIn).connect(overdriveNodeOut)
        .connect(ampNodeIn).connect(ampNodeOut)
        .connect(cabSimNodeIn).connect(cabSimNodeOut)
        .connect(analyserNode)
        .connect(audioCtx.destination); //destination = speaker of ur computer , often be the last node to connect!

}

//efx----------InputChannelSelector

var InputSelectNodeIn = audioCtx.createGain();
var InputSelectNodeOut = audioCtx.createGain();
var InputNodeL = audioCtx.createGain();
var InputNodeR = audioCtx.createGain();
var splitter = audioCtx.createChannelSplitter(2);
var merger = audioCtx.createChannelMerger(2);

InputSelectNodeIn.connect(splitter)
splitter.connect(merger, 0, 1);
merger.connect(InputSelectNodeOut);

// const inputSelect = document.getElementById('InputSelect')

function inputSelect(selectObject) {
    var value = selectObject.value;  

    if (value=="mono1"){
        console.log('Change Input to Mono L');
        InputSelectNodeIn.disconnect(InputSelectNodeOut);

        InputSelectNodeIn.connect(splitter);
        splitter.connect(merger, 0, 1);
        merger.connect(InputSelectNodeOut);
    }
    else if (value=="Stereo"){
        console.log('Change Input to Stereo');
        InputSelectNodeIn.disconnect(splitter);
        splitter.disconnect(merger, 0, 1);
        merger.disconnect(InputSelectNodeOut);

        InputSelectNodeIn.connect(InputSelectNodeOut);
        
    }
}
//efx================================================================================================
//Overdrive 還沒設定好filter的listener
const overdriveAmountKnob = document.getElementById('overdriveAmount');
const overdriveGainKnob = document.getElementById('overdriveGain');
const overdriveSwitch = document.getElementById('overdriveSwitch');
const overdriveFreq = document.getElementById('overdriveFreq');
var overdriveNodeIn = audioCtx.createGain();
var overdriveNodeOut = audioCtx.createGain();
const overdriveWetBandNode = new BiquadFilterNode(audioCtx, {
    type: 'highshelf',
    frequency:3000,
    gain: 1
})
const overdriveDryBandNode = new BiquadFilterNode(audioCtx, {
    type: 'lowshelf',
    frequency:(20000 - 3000),
    gain: 1
})

thr = 10;

const overdriveGainNode = new GainNode(audioCtx, {gain: overdriveGainKnob.value})
const overdriveNode = audioCtx.createWaveShaper();
overdriveNode.oversample = '4x';
overdriveNode.curve = makeDistortionCurve(0);

//drive_listener
overdriveAmountKnob.addEventListener('input', e => {
    const value = parseFloat(e.target.value) // to get the value from gui
    overdriveNode.curve = makeDistortionCurve(value);    
})

overdriveGainKnob.addEventListener('input', e => {
    const value = parseFloat(e.target.value) // to get the value from gui
    // overdriveNode.gain.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    overdriveGainNode.gain.setTargetAtTime(value, audioCtx.currentTime,.01);
})

overdriveNodeIn.connect(overdriveGainNode);
overdriveGainNode.connect(overdriveNodeOut);
// overdriveNodeIn.connect(overdriveGainNode);
// overdriveGainNode.connect(overdriveWetBandNode).connect(overdriveNode).connect(overdriveNodeOut);
// overdriveGainNode.connect(overdriveDryBandNode).connect(overdriveNodeOut);
// //default = bypass
// overdriveGainNode.disconnect(overdriveWetBandNode);
// overdriveGainNode.disconnect(overdriveDryBandNode);
// overdriveGainNode.connect(overdriveNodeOut);

function overdrive_on(){
    if (overdriveSwitch.checked){
        console.log('overdrive_on')
        overdriveGainNode.disconnect(overdriveNodeOut);
        overdriveGainNode.connect(overdriveNode);
        overdriveNode.connect(overdriveNodeOut);
        // overdriveGainNode.connect(overdriveWetBandNode);
        // overdriveGainNode.connect(overdriveDryBandNode);
    }
    else if (!overdriveSwitch.checked){
        console.log('overdrive_off')
        // overdriveGainNode.disconnect(overdriveWetBandNode);
        // overdriveGainNode.disconnect(overdriveDryBandNode);
        overdriveGainNode.disconnect(overdriveNode);
        overdriveGainNode.connect(overdriveNodeOut);
    }
}

overdriveFreq.addEventListener('input', e => {
    const value = parseInt(e.target.value) // to get the value from gui
    // gainNode.gain.value = value
    overdriveWetBandNode.frequency.setTargetAtTime(value, audioCtx.currentTime,.01) // this can smooth the signal when changing volume
    overdriveDryBandNode.frequency.setTargetAtTime(20000-value, audioCtx.currentTime,.01)
})

function makeDistortionCurve(amount) {
    let k = typeof amount === 'number' ? amount : 50,
    //   n_samples = 44100,
      n_samples = 256,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for ( ; i < n_samples; ++i ) {
        x = (i * 2 / n_samples - 1);
        
        // if(i<n_samples/2){
        //     curve[i] = x;
        // }
        // else{
        //     curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) )
        // }

        //----1
        curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) )

        // //----2
        // curve[i] = (2/Math.PI)*Math.atan(x);


        // //----3
        // curve[i]=x;
        // console.log(curve[i])

        // if (curve[i]>0){
        //     curve[i] = Math.min(curve[i],thr)
        // }
        // else{
        //     curve[i] = Math.max(curve[i],(-1)*thr)
        // }

        // //----4
        // curve[i] = 2/(1+Math.exp(-k*x)) - 1;

        // //----5 overdrive
        // console.log(x);
        // if (Math.abs(x)<1/3){
        //     curve[i] = 2*x;
        //     break;
        // }
        // else if (Math.abs(x)<2/3){
        //     curve[i] = ( 3-(2-3*x)^2 )/3;
        //     break;
        // }
        // else{
        //     curve[i] = 1;
        // }

    }
    return curve
};






//efx----------amp
var ampNodeIn = audioCtx.createGain();
var ampNodeOut = audioCtx.createGain();

const ampGain = document.getElementById('ampGain');
const ampVolume = document.getElementById('ampVolume');
const ampBass = document.getElementById('ampBass');
const ampMid = document.getElementById('ampMid');
const ampTreble = document.getElementById('ampTreble');

const ampGainNode = new GainNode(audioCtx, {gain: ampGain.value})
const ampBassNode = new BiquadFilterNode(audioCtx, {
    type: 'lowshelf',
    frequency:500,
    gain: ampBass.value
})
const ampMidNode = new BiquadFilterNode(audioCtx, {
    type: 'peaking',
    Q: Math.SQRT1_2,
    frequency:1500,
    gain: ampMid.value
})
const ampTrebleNode = new BiquadFilterNode(audioCtx, {
    type: 'highshelf',
    frequency:3000,
    gain: ampTreble.value
})

ampGain.addEventListener('input', e => {
    const value = parseFloat(e.target.value) // to get the value from gui
    ampGainNode.gain.setTargetAtTime(value, audioCtx.currentTime,.01) 
})
ampBass.addEventListener('input', e => {
    const value = parseInt(e.target.value) 
    ampBassNode.gain.setTargetAtTime(value, audioCtx.currentTime,.01)
})
ampMid.addEventListener('input', e => {
    const value = parseInt(e.target.value) 
    ampMidNode.gain.setTargetAtTime(value, audioCtx.currentTime,.01)
})
ampTreble.addEventListener('input', e => {
    const value = parseInt(e.target.value) 
    ampTrebleNode.gain.setTargetAtTime(value, audioCtx.currentTime,.01)
})
ampVolume.addEventListener('input', e => {
    const value = parseFloat(e.target.value) 
    ampNodeOut.gain.setTargetAtTime(value, audioCtx.currentTime,.01)
})

ampNodeIn
    .connect(ampGainNode)
    .connect(ampBassNode)
    .connect(ampMidNode)
    .connect(ampTrebleNode)
    .connect(ampNodeOut)


//efx----------capSimulator----------
var cabSimNodeIn = audioCtx.createGain();
var cabSimNodeOut = audioCtx.createGain();

const getImpulseBuffer = (audioCtx, impulseUrl) => {
    return fetch(impulseUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
}

const cabSimConvolverNode = audioCtx.createConvolver();
async function cabSimInit(){
    // cabSimConvolverNode.buffer = await getImpulseBuffer(audioCtx, 'amp-ir-pack/THE DARK TONE IR PACK 2/ORANGE 4x12.wav');
    // cabSimConvolverNode.buffer = await getImpulseBuffer(audioCtx, 'amp-ir-pack/THE DARK TONE IR PACK 2/MARSHALL 1960.wav');
    cabSimConvolverNode.buffer = await getImpulseBuffer(audioCtx, 'amp-ir-pack/ZETA IR PACK/IRs/Mesa 4x12 SPKR 2 position 1.wav');
    
}
cabSimInit();

cabSimNodeIn
    .connect(cabSimConvolverNode)
    .connect(cabSimNodeOut);

//------Visualizer
const visualizer = document.getElementById('visualizer');
const fftsize = 2048;
const analyserNode = new AnalyserNode(audioCtx, {fftSize: fftsize})

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

// Resize
function setupEventListeners(){ 
    window.addEventListener('resize',resize)
    
}

function resize(){ // change the bar into high resolution  
    visualizer.width = visualizer.clientWidth * window.devicePixelRatio
    visualizer.height = visualizer.clientHeight * window.devicePixelRatio
} 
//------Init

setupEventListeners()
setupContext()
resize()
drawVisualizer()