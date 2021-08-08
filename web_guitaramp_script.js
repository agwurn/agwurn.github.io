const volume = document.getElementById('volume')
const bass = document.getElementById('bass')
const mid = document.getElementById('mid')
const treble = document.getElementById('treble')
const visualizer = document.getElementById('visualizer')
const fftsize = 256

const context = new AudioContext()
const analyserNode = new AnalyserNode(context, {fftSize: fftsize})

const gainNode = new GainNode(context, {gain: volume.value})
const bassEQ = new BiquadFilterNode(context, {
    type: 'lowshelf',
    frequency:500,
    gain: bass.value
})
const midEQ = new BiquadFilterNode(context, {
    type: 'peaking',
    Q: Math.SQRT1_2,
    frequency:1500,
    gain: mid.value
})
const trebleEQ = new BiquadFilterNode(context, {
    type: 'highshelf',
    frequency:3000,
    gain: treble.value
})

setupEventListeners()
setupContext()
resize()
drawVisualizer()



function setupEventListeners(){

    window.addEventListener('resize',resize)

    volume.addEventListener('input', e => {
        const value = parseFloat(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        gainNode.gain.setTargetAtTime(value, context.currentTime,.01) // this can smooth the signal when changing volume

    })
    bass.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        bassEQ.gain.setTargetAtTime(value, context.currentTime,.01) // this can smooth the signal when changing volume
    })
    mid.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        midEQ.gain.setTargetAtTime(value, context.currentTime,.01) // this can smooth the signal when changing volume
    })
    treble.addEventListener('input', e => {
        const value = parseInt(e.target.value) // to get the value from gui
        // gainNode.gain.value = value
        trebleEQ.gain.setTargetAtTime(value, context.currentTime,.01) // this can smooth the signal when changing volume
    })
}


async function setupContext(){
    const guitar = await getGuitar()
    // to avoid google limitation of audio device
    if(context.state === 'suspended'){
        await context.resume();
    }


    const source = context.createMediaStreamSource(guitar)

    source
        .connect(bassEQ)
        .connect(midEQ)
        .connect(trebleEQ)
        .connect(gainNode)
        
        .connect(analyserNode)
        .connect(context.destination) //destination = speaker of ur computer , often be the last node to connect!

}

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

function drawVisualizer(){
    requestAnimationFrame(drawVisualizer)

    const bufferLength = analyserNode.frequencyBinCount // how many bins
    const dataArray = new Uint8Array(bufferLength)
    analyserNode.getByteFrequencyData(dataArray)

    const width = visualizer.width
    const height = visualizer.height
    const barWidth = width/bufferLength

    const canvasContext = visualizer.getContext('2d')
    canvasContext.clearRect(0,0,width,height)

    dataArray.forEach((item,index)=>{
        const y = item/255 * height/2
        const x = barWidth*index

        //draw
        canvasContext.fillStyle = `hsl(${(y/height)*200+200},50%,50%)` // hue saturation lightness
        canvasContext.fillRect(x,(height-y)/4,barWidth,y/4)

    })
}

function resize(){ // change the bar into high resolution  
    visualizer.width = visualizer.clientWidth * window.devicePixelRatio
    visualizer.height = visualizer.clientHeight * window.devicePixelRatio

}