// js/script.js
// Get DOM elements for camera functionality (used in report.html)
const capturePhotoBtn = document.getElementById('capture-photo-btn');
const recordVideoBtn = document.getElementById('record-video-btn');
const video = document.getElementById('video');
const snapBtn = document.getElementById('snap-btn');
const startRecordBtn = document.getElementById('start-record-btn');
const stopRecordBtn = document.getElementById('stop-record-btn');
const canvas = document.getElementById('canvas');
const photoList = document.getElementById('photo-list');
const cameraPreview = document.getElementById('camera-preview');
const videoPreview = document.getElementById('video-preview');
const recordedVideo = document.getElementById('recorded-video');

// Get DOM elements for location (used in report.html)
const locationInput = document.getElementById('location');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');

// Variables to store captured media
let capturedPhotos = [];
let recordedVideoFile = null;
let mediaRecorder = null;
let videoStream = null;
let recording = false;

// Utility function to generate a unique identifier
function generateUniqueId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debug: Check if DOM elements are found
console.log('Location Input:', locationInput);
console.log('Latitude Input:', latitudeInput);
console.log('Longitude Input:', longitudeInput);
console.log('Capture Photo Button:', capturePhotoBtn);
console.log('Record Video Button:', recordVideoBtn);
console.log('Video Element:', video);

// Debug: Check if Geolocation and MediaDevices are supported
console.log('Geolocation supported:', !!navigator.geolocation);
console.log('MediaDevices supported:', !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia);

// Automatically get the user's location on page load (for report.html)
if (locationInput && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Location fetched:', { latitude, longitude });
            locationInput.value = `Lat: ${latitude}, Lng: ${longitude}`;
            latitudeInput.value = latitude;
            longitudeInput.value = longitude;
        },
        (error) => {
            console.error('Error getting location:', error);
            locationInput.value = 'Unable to detect location: ' + error.message;
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
} else if (locationInput) {
    console.error('Geolocation not supported');
    locationInput.value = 'Geolocation not supported by your browser';
}

// Function to start the camera
async function startCamera(requireAudio = false) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('MediaDevices not supported');
        alert('Camera access not supported by your browser.');
        return false;
    }

    try {
        console.log('Requesting camera access...', { video: true, audio: requireAudio });
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: requireAudio });
        console.log('Camera stream obtained:', videoStream);
        video.srcObject = videoStream;
        video.muted = true;
        cameraPreview.style.display = 'block';
        return true;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera: ' + error.message + '. Please allow camera access or try a different device.');
        return false;
    }
}

// Handle capturing photos when the "Take Picture" button is clicked
capturePhotoBtn?.addEventListener('click', async () => {
    const cameraStarted = await startCamera(false);
    if (cameraStarted) {
        snapBtn.style.display = 'block';
        startRecordBtn.style.display = 'none';
        stopRecordBtn.style.display = 'none';
        capturePhotoBtn.style.display = 'none';
        recordVideoBtn.style.display = 'none';
    }
});

// Handle capturing the photo when the "Capture" button is clicked
snapBtn?.addEventListener('click', () => {
    console.log('Capturing photo...');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const photoDataURL = canvas.toDataURL('image/jpeg', 0.7);
    
    const img = document.createElement('img');
    img.src = photoDataURL;
    img.style.width = '100px';
    img.style.height = '100px';
    photoList.appendChild(img);

    canvas.toBlob((blob) => {
        const uniqueId = generateUniqueId();
        const photoFile = new File([blob], `evidence-photo-${capturedPhotos.length + 1}-${uniqueId}.jpeg`, { type: 'image/jpeg' });
        capturedPhotos.push(photoFile);
        console.log('Captured photos:', capturedPhotos);

        videoStream.getTracks().forEach(track => track.stop());
        cameraPreview.style.display = 'none';
        capturePhotoBtn.style.display = 'block';
        recordVideoBtn.style.display = 'block';
        snapBtn.style.display = 'none';
    }, 'image/jpeg', 0.7);
});

// Handle recording video when the "Record Video" button is clicked
recordVideoBtn?.addEventListener('click', async () => {
    const cameraStarted = await startCamera(true);
    if (cameraStarted) {
        startRecordBtn.style.display = 'block';
        stopRecordBtn.style.display = 'none';
        snapBtn.style.display = 'none';
        capturePhotoBtn.style.display = 'none';
        recordVideoBtn.style.display = 'none';
    }
});

// Start recording video
startRecordBtn?.addEventListener('click', () => {
    console.log('Starting video recording...');
    const chunks = [];
    mediaRecorder = new MediaRecorder(videoStream);
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const uniqueId = generateUniqueId();
        recordedVideoFile = new File([blob], `evidence-video-${uniqueId}.webm`, { type: 'video/webm' });
        recordedVideo.src = URL.createObjectURL(blob);
        recordedVideo.muted = false;
        videoPreview.style.display = 'block';
        console.log('Recorded video file:', recordedVideoFile);

        videoStream.getTracks().forEach(track => track.stop());
        cameraPreview.style.display = 'none';
        capturePhotoBtn.style.display = 'block';
        recordVideoBtn.style.display = 'block';
        startRecordBtn.style.display = 'none';
        stopRecordBtn.style.display = 'none';
    };
    mediaRecorder.start();
    recording = true;
    startRecordBtn.style.display = 'none';
    stopRecordBtn.style.display = 'block';

    setTimeout(() => {
        if (recording) {
            console.log('Automatically stopping video recording after 30 seconds');
            mediaRecorder.stop();
            recording = false;
        }
    }, 30000);
});

// Stop recording video
stopRecordBtn?.addEventListener('click', () => {
    console.log('Stopping video recording...');
    mediaRecorder.stop();
    recording = false;
});

// Crime Reporting Form Submission (for report.html)
document.getElementById('crime-report-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const crimeData = {
        crimeType: formData.get('crime-type'),
        description: formData.get('description'),
        location: {
            lat: parseFloat(formData.get('latitude')),
            lng: parseFloat(formData.get('longitude')),
            display: formData.get('location')
        },
        timestamp: new Date().toISOString(),
    };

    // Add captured photos and video to FormData
    capturedPhotos.forEach((photo, index) => {
        formData.append('photos', photo);
    });
    if (recordedVideoFile) {
        formData.append('video', recordedVideoFile);
    }

    try {
        console.log('Submitting crime report to backend...');
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to upload files');
        }

        // Show success alert
        alert('Successfully report was completed');

        // Reset the form
        e.target.reset();
        if (photoList) photoList.innerHTML = '';
        if (videoPreview) videoPreview.style.display = 'none';
        if (recordedVideo) recordedVideo.src = '';
        capturedPhotos = [];
        recordedVideoFile = null;
        if (locationInput) locationInput.value = '';
        if (latitudeInput) latitudeInput.value = '';
        if (longitudeInput) longitudeInput.value = '';
    } catch (error) {
        console.error('Error submitting report:', error.message, error);
        alert('Error submitting report: ' + error.message);
    }
});

// Emergency SOS Button (for emergency.html)
document.getElementById('sos-btn')?.addEventListener('click', async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const sosData = {
                    location: { lat: latitude, lng: longitude },
                    timestamp: new Date().toISOString(),
                };

                try {
                    // Send SOS data to the backend
                    const response = await fetch('/sos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sosData)
                    });
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to send SOS');
                    }
                    alert('SOS sent with location to police and contacts! (Saved to backend)');
                } catch (error) {
                    console.error('Error sending SOS:', error);
                    alert('Error sending SOS: ' + error.message);
                }
            },
            (error) => {
                console.error('Error getting location for SOS:', error);
                alert('Error getting location: ' + error.message);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        alert('Geolocation not supported by your browser.');
    }
});