

import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

// Function to initialize the camera kit session
async function initCameraKit() {
  try {
    // Initialize the camera kit with the appropriate API token
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    // Create a new session
    const session = await cameraKit.createSession();

    // Append the live output to the body
    document.body.appendChild(session.output.live);

    // Load and apply lenses
    const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
      session.applyLens(lenses[0]);

    // Configure media stream with high resolution
    let mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: window.innerWidth, height: window.innerHeight, facingMode: 'environment' }
    });

    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);
    session.source.setRenderSize(window.innerWidth, window.innerHeight);
    session.play();
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

// Initialize the camera kit on page load
document.addEventListener('DOMContentLoaded', initCameraKit);
