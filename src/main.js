import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

document.addEventListener('DOMContentLoaded', async function() {
  await startCameraKit();
});

async function startCameraKit() {
  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    const session = await cameraKit.createSession();

    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      document.body.appendChild(session.output.live);

      const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
      session.applyLens(lenses[0]);

      let mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 4096, height: 2160, facingMode: 'environment' }
      });

      const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
      await session.setSource(source);
      session.source.setRenderSize(window.innerWidth, window.innerHeight);
      session.play();
    } else {
      console.error('Canvas element not found');
    }
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

