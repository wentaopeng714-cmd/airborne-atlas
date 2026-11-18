// A classic worker is intentional: this version of MediaPipe loads its local
// Emscripten runtime with importScripts(). The model remains on this device.
let detector;
self.onmessage = async ({data}) => {
  const {frame,time} = data;
  try {
    if (data.type === 'init') {
      const {createHandDetector} = await import('./gesture.js');
      detector = await createHandDetector();
      self.postMessage({type:'ready'});
    } else if (frame) {
      const result = detector.detectForVideo(frame,time);
      self.postMessage({type:'result',result:{landmarks:result.landmarks,handedness:result.handedness}});
    }
  } catch (error) {
    self.postMessage({type:'error',detail:String(error?.message || error)});
  } finally {
    frame?.close();
  }
};
