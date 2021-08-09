
// audio1.src = "Agwurn-HeartBeat.mp3";

// const container = document.getElementById('play');
const canvas = document.getElementById('visualizer')
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d')

let audioSource;
let analyser;



function playAudio() {
    
    // audio1.play();
// }


// container.addEventListener('click',function(){
    // let audio1 = new Audio('Agwurn-HeartBeat.mp3');
    // const audio1 = document.getElementById('audio1');
    // audio1.src = "Agwurn-HeartBeat.mp3";
    var audioCtx = new AudioContext();
    var audioSource = audioCtx.createMediaElementSource(document.getElementById('audio1'));
    audioSource.crossOrigin = 'anonymous';
    
    analyser = audioCtx.createAnalyser();
    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 64;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const barWidth = canvas.width/bufferLength; // bufferlength is a quantity
    let barHeight;


    function animate(){
        ctx.clearRect(0,0,canvas.width,canvas.height);//clear the window!
        analyser.getByteFrequencyData(dataArray);
        let draw_x = 0
        for(let i = 0; i < bufferLength; i++){
            barHeight = dataArray[i]; // the volume of each freq
            ctx.fillStyle = 'white';
            ctx.fillRect(draw_x, canvas.height - barHeight, barWidth, barHeight);
            draw_x += barWidth;
        }

        requestAnimationFrame(animate);
    }
    animate();

};