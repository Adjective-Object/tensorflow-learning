let openCVReady = false;

// window.onOpenCvReady called when the async script
// including opencv as a global finishes evaluating.
(window as any).onOpenCvReady = () => {
  openCVReady = true;
  for (let promiseCb of queuedPromises) {
    promiseCb();
  }
};

const queuedPromises: (() => void)[] = [];

interface OpenCV {
  // TODO define bits of openCV we use
}

function getCV(): Promise<OpenCV> {
  if (openCVReady) {
    return Promise.resolve((window as any).cv as OpenCV);
  } else {
    return new Promise<OpenCV>((resolve, reject) => {
      queuedPromises.push(() => resolve((window as any).cv as OpenCV));
    });
  }
}
