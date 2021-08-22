// susresBtn = document.getElementById('btn');

const func = function() {
	// if(audioCtx.state === 'running') {
	//   audioCtx.suspend().then(function() {
	// 	// susresBtn.textContent = 'Resume context';
	//   });
	// } else if(audioCtx.state === 'suspended') {
	//   audioCtx.resume().then(function() {
	// 	// susresBtn.textContent = 'Suspend context';
	//   });
	// }
	// console.log('f')
	// initialize Audio Context
	try {
		var audioContext = new (window.AudioContext || window.webkitAudioContext)();		
	}
	catch (e) {
		alert("Web Audio API is not supported in this browser");
	}
	const audioCtx = new AudioContext();
	audioCtx.resume();

	// load hrir to the container
	var hrtfContainer = new HRTFContainer();
	hrtfContainer.loadHrir("../hrir/kemar_L.bin");

	// create audio source node from the <audio> element
	var sourceNode = audioCtx.createMediaElementSource(document.getElementById("player"));
	var gain = audioCtx.createGain();
	gain.gain.value = 0.3;
	sourceNode.connect(gain);

	// create new hrtf panner, source node gets connected automatically
	var panner = new HRTFPanner(audioCtx, gain, hrtfContainer);

	// connect the panner to the destination node
	panner.connect(audioCtx.destination);

	// animate source
	var t = 0;
	var x, y, z;
	setInterval(function () {
		x = Math.sin(t);
		y = Math.cos(t);
		z = 0;
		t += 0.05;
		var cords = cartesianToInteraural(x, y, z);
		panner.update(cords.azm, cords.elv);
	}, 50);


}

window.onload = function () {
	
}