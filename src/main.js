import { bootstrapCameraKit, createMediaStreamSource } from '@snap/camera-kit';

// Function to initialize the Snap Camera Kit
async function startCameraKit() {
  try {
    // Initialize the camera kit with the appropriate API token
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    // Create a new camera session
    const session = await cameraKit.createSession();

    // Obtain and configure the media stream for high resolution
    let mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 4096, height: 2160, facingMode: 'environment' }

    });

    // Create a media stream source and set it to the session
    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);

    // Set the render size to match the window dimensions for better scaling
    session.source.setRenderSize(window.innerWidth, window.innerHeight);
    session.play();

    // Replace the canvas element with the live output from the camera session
    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      canvasElement.replaceWith(session.output.live);
    } else {
      console.error('Canvas element not found');
    }

    // Load and apply a lens from the lens repository
    const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']); // Replace with your actual lens group ID
    session.applyLens(lenses[0]);

  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

// Function to handle the presence of a token
function handleToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    // Remove or hide all other containers
    const containers = document.querySelectorAll('.container');
    containers.forEach(container => container.style.display = 'none');

    // Start the camera kit session
    startCameraKit();
  }
}

// Call the function to check for token and potentially start the camera kit
document.addEventListener('DOMContentLoaded', handleToken);
