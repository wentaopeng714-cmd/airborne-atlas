const asset = (name) => new URL('./vendor/hand/' + name, import.meta.url).href;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const fingertipRange = 0.12;
const railCommands = ['play', 'theme', 'seed'];
const dwellMs = 480;
const sensitivityProfiles = {
  light: {touch: .46, soft: .59, release: .68},
  normal: {touch: .39, soft: .52, release: .63},
  firm: {touch: .30, soft: .41, release: .55}
};
const handColors = ['#ffe6a2', '#baf9e4'];
const bones = [[0,1,2,3,4], [0,5,6,7,8], [5,9,13,17,0], [9,10,11,12], [13,14,15,16], [17,18,19,20]];
const emptyHand = () => ({
  lastSeen: -Infinity, wristX: 0, wristY: 0, label: '', hovering: false,
  armed: false, wideSince: null, narrowSince: null, lastStrike: -Infinity,
  indexX: 0, indexY: .5, lastRatio: 0, approach: 0, pressed: false,
  commandZone: null, commandHover: null, dwell: 0, openSpan: .97
});

function measure(points, aspect) {
  const distance = (a, b) => Math.hypot((points[a].x - points[b].x) * aspect, points[a].y - points[b].y);
  const palm = Math.max(distance(5, 17), distance(0, 9) * 0.7, 0.0001);
  return {
    wristX: 1 - points[0].x, wristY: points[0].y,
    indexX: 1 - points[8].x, indexY: points[8].y, palm, pinch: distance(4, 8) / palm
  };
}

// Match both landmarks jointly. A recent wrist position is the main identity
// cue, with the model's handedness as a tie-breaker when the hands cross.
function assignHands(hands, detections, now) {
  const cost = (hand, det, slot) => {
    if (now - hand.lastSeen > 650) return 0.43 + Math.abs(det.wristX - (slot ? 0.8 : 0.2)) * 0.14;
    const wristTravel = Math.hypot(det.wristX-hand.wristX,(det.wristY-hand.wristY)*.6);
    const tipTravel = Math.hypot(det.indexX-hand.indexX,(det.indexY-hand.indexY)*.65);
    // During a quick contact the finger can stay over the same key while
    // the estimated wrist jumps as the model updates its tracking box.
    const sameAim = hand.hovering && now-hand.lastSeen<160 && tipTravel<.105;
    const movement = sameAim ? Math.min(wristTravel,.055+tipTravel*1.25) : wristTravel;
    const mismatch = hand.label && det.label && hand.label !== det.label ? 0.20 : 0;
    // A recently lost slot should not steal an established hand when its
    // fingers fold or the wrist rotates at the moment of contact.
    return movement + mismatch + (hand.hovering ? 0 : .18);
  };
  if (!detections.length) return [];
  const costA = cost(hands[0], detections[0], 0);
  const costB = cost(hands[1], detections[0], 1);
  if (detections.length === 1) return [costA <= costB ? 0 : 1];
  return costA + cost(hands[1], detections[1], 1) <= costB + cost(hands[0], detections[1], 0)
    ? [0, 1] : [1, 0];
}

function cameraProblem(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError': return '摄像头权限未开启。允许此网站使用摄像头后，再开启隔空演奏。';
    case 'NotFoundError':
    case 'OverconstrainedError': return '没有找到可用摄像头。请连接摄像头，或用带前置镜头的手机打开。';
    case 'NotReadableError':
    case 'AbortError': return '摄像头暂时不可用。关闭正在占用镜头的应用后再试。';
    default: return '镜头打开失败，请检查摄像头后再试。';
  }
}

export async function createHandDetector() {
  const {FilesetResolver,HandLandmarker} = await import('./vendor/hand/vision_bundle.mjs');
  const files = await FilesetResolver.forVisionTasks(asset('wasm'));
  return HandLandmarker.createFromOptions(files, {
    baseOptions: {modelAssetPath:asset('hand_landmarker.task'),delegate:'CPU'},
    runningMode:'VIDEO',numHands:2,
    minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.55
  });
}

async function localDetector() {
  const model = await createHandDetector();
  return {kind:'main', estimate:(video,time)=>model.detectForVideo(video,time), close:()=>model.close()};
}

async function backgroundDetector(signal) {
  if (!window.Worker || !window.OffscreenCanvas || (!window.VideoFrame && !window.createImageBitmap))
    throw Error('Worker frames unavailable');
  const worker = new Worker(new URL('./gesture-worker.js',import.meta.url), {name:'浮音 · 手势'});
  let pending, stopped = false, workerError;
  const fail = error => {
    const job = pending;
    pending = null;
    job?.reject(error);
  };
  const close = () => {
    if (stopped) return;
    stopped = true;
    worker.terminate();
    signal.removeEventListener('abort',close);
    fail(Error('Worker stopped'));
  };
  signal.addEventListener('abort',close,{once:true});
  worker.onmessage = ({data}) => {
    if (!pending) return;
    if (data.type === 'error') { fail(Error(data.detail)); return; }
    const job = pending;
    pending = null;
    job.resolve(data.result);
  };
  worker.onerror = event => {
    event.preventDefault();
    workerError = Error(event.message || 'Worker error');
    fail(workerError);
  };
  const send = (message,transfer=[]) => new Promise((resolve,reject) => {
    if (stopped || workerError) {reject(workerError || Error('Worker stopped'));return;}
    pending = {resolve,reject};
    try {worker.postMessage(message,transfer);}
    catch (error) {fail(error);}
  });
  const timeout = setTimeout(()=>fail(Error('Worker setup timed out')),20000);
  try {
    await send({type:'init'});
  } catch (error) {
    close();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  return {
    kind:'worker', close,
    async estimate(video,time) {
      const frame = window.VideoFrame
        ? new VideoFrame(video,{timestamp:Math.round(time*1000)}) : await createImageBitmap(video);
      const watchdog = setTimeout(()=>fail(Error('Worker frame timed out')),4000);
      try {return await send({type:'frame',frame,time},[frame]);}
      finally {clearTimeout(watchdog);frame.close();}
    }
  };
}

export class AirHands {
  constructor({video, canvas, onHover = () => {}, onStrike = () => {}, onStatus = () => {}, onCommand, weatherControl = false, lightControl = false, sensitivity = 'normal', onCommandHover = () => {}}) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onHover = onHover;
    this.onStrike = onStrike;
    this.onCommand = onCommand;
    this.commands = weatherControl || lightControl
      ? ['play','theme',...(weatherControl?['weather']:[]),...(lightControl?['light']:[]),'seed'] : railCommands;
    this.onCommandHover = onCommandHover;
    this.inputEnabled = true;
    this.profile = sensitivityProfiles[sensitivity] || sensitivityProfiles.normal;
    this.inputRevision = 0;
    this.nextCommand = -Infinity;
    this.onStatus = onStatus;
    this.epoch = 0;
    this.hands = [emptyHand(), emptyHand()];
    this.video.muted = true;
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.setAttribute('playsinline', '');
    this.video.style.objectFit = this.canvas.style.objectFit = 'contain';
    this.video.style.transform = 'scaleX(-1)';
    this.canvas.style.transform = 'none';
    this.canvas.style.pointerEvents = 'none';
    this.onEnd = () => {
      this.stop(false);
      this.status('error', '摄像头连接已中断，点按隔空演奏可以重新连接。');
    };
    this.onHide = () => this.stop();
    this.onVisibility = () => {
      if (document.hidden) this.clearHands();
    };
  }

  status(state, detail) {
    if (this.state === state && this.detail === detail) return;
    this.state = state;
    this.detail = detail;
    this.onStatus(state, detail);
  }

  async start() {
    if (this.opening) return this.opening;
    if (this.detector) return true;
    const epoch = ++this.epoch;
    this.abort = new AbortController();
    const operation = this.open(epoch);
    this.opening = operation;
    try {
      return await operation;
    } finally {
      if (this.opening === operation) this.opening = null;
    }
  }

  async open(epoch) {
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      this.status('error', '请用 Safari 或 Chrome 从 HTTPS 链接或本机预览打开，再开启摄像头。');
      return false;
    }
    window.addEventListener('pagehide', this.onHide);
    this.status('loading', '请允许使用前置摄像头');
    let startingModel = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {facingMode: {ideal: 'user'}, width: {ideal: 640}, height: {ideal: 480}, frameRate: {ideal: 60, max: 60}}
      });
      if (epoch !== this.epoch) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }
      this.stream = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', this.onEnd);
      this.video.srcObject = stream;
      await this.video.play();
      if (epoch !== this.epoch) return false;
      startingModel = true;
      this.status('loading', '正在加载本地手势识别');
      let detector;
      try {
        detector = await backgroundDetector(this.abort.signal);
      } catch {
        if (epoch !== this.epoch) return false;
        detector = await localDetector();
      }
      if (epoch !== this.epoch) {
        detector.close();
        return false;
      }
      this.detector = detector;
      this.frameBusy = false;
      this.latestTime = null;
      this.lastVideoTime = -1;
      document.addEventListener('visibilitychange', this.onVisibility);
      this.status('ready', '掌心朝向镜头，分开拇指和食指');
      this.schedule(epoch);
      return true;
    } catch (error) {
      if (epoch !== this.epoch) return false;
      this.stop(false);
      this.status('error', startingModel
        ? '手势识别加载失败。请刷新页面，或换用较新的 Safari、Chrome 再试。'
        : cameraProblem(error));
      return false;
    }
  }

  schedule(epoch) {
    const tick = (now,meta) => {
      if (epoch !== this.epoch || !this.detector) return;
      // Subscribe before capture. Each actual camera frame gets a chance,
      // with at most one inference in flight. If it is busy, remember only
      // the freshest frame stamp and sample the live video when it completes.
      this.schedule(epoch);
      const videoTime = meta?.mediaTime ?? this.video.currentTime;
      if (document.hidden || !this.inputEnabled || this.video.readyState<2 || videoTime===this.lastVideoTime) return;
      this.lastVideoTime = videoTime;
      if (this.frameBusy) this.latestTime = now;
      else this.estimateFrame(epoch,now);
    };
    this.useVideoFrames = typeof this.video.requestVideoFrameCallback === 'function';
    this.frame = this.useVideoFrames
      ? this.video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
  }

  async estimateFrame(epoch,time) {
    this.frameBusy = true;
    const backend = this.detector;
    const revision = this.inputRevision;
    const {videoWidth,videoHeight} = this.video;
    try {
      const result = await backend.estimate(this.video,time);
      if (epoch===this.epoch && revision===this.inputRevision && !document.hidden)
        this.process(result,time,videoWidth,videoHeight);
    } catch {
      if (epoch!==this.epoch) return;
      // Some browsers support workers and video frames but cannot upload that
      // frame type into worker WebGL. Keep the camera and switch on-device.
      if (backend.kind==='worker') {
        backend.close();
        this.clearHands();
        try {
          const replacement = await localDetector();
          if (epoch !== this.epoch) replacement.close();
          else this.detector = replacement;
          return;
        } catch { /* Show the shared recovery state below. */ }
      }
      if (epoch === this.epoch) {
        this.stop(false);
        this.status('error','手势识别已中断。请重新开启隔空演奏。');
      }
    } finally {
      if (epoch===this.epoch) {
        this.frameBusy = false;
        const nextTime = this.latestTime;
        this.latestTime = null;
        if (nextTime!=null && performance.now()-nextTime<90 && !document.hidden && this.inputEnabled)
          this.estimateFrame(epoch,nextTime);
      }
    }
  }

  process(result, now, width, height) {
    if (!this.inputEnabled) return;
    const detections = result.landmarks.slice(0, 2).map((points, i) => {
      const side = (result.handedness ?? result.handednesses)?.[i]?.[0];
      return {...measure(points, width / height), points, confidence:side?.score ?? 0, label: side?.score >= 0.65 ? side.categoryName : ''};
    });
    if (detections.length===2) {
      // A sudden pose change can seed a second overlapping tracking box on
      // the same hand. Compare palm landmarks before allocating hand slots.
      const [a,b] = detections;
      const separation = [0,5,9,13,17].reduce((sum,j)=>sum+Math.hypot(
        (a.points[j].x-b.points[j].x)*width/height, a.points[j].y-b.points[j].y
      ),0)/5;
      const sameSide = !a.label || !b.label || a.label===b.label;
      if (sameSide && separation < Math.min(a.palm,b.palm)*.48)
        detections.splice(a.confidence>=b.confidence ? 1 : 0,1);
    }
    const slots = assignHands(this.hands, detections, now);
    for (let slot = 0; slot < 2; slot++) {
      if (!slots.includes(slot) && now - this.hands[slot].lastSeen > 140) this.loseHand(slot);
    }
    detections.forEach((det, i) => this.moveHand(slots[i], det, now));
    if (!this.inputEnabled) return;
    this.draw(detections, slots, width, height);
    const visible = this.hands.filter((hand) => hand.hovering).length;
    this.status(visible ? 'tracking' : 'ready', visible ? (visible === 2 ? '双手已识别 · 捏合奏响' : '已识别手部 · 捏合奏响') : '掌心朝向镜头，分开拇指和食指');
  }

  moveHand(slot, det, now) {
    if (!this.inputEnabled) return;
    let hand = this.hands[slot];
    const elapsed = now - hand.lastSeen;
    if (elapsed > 200) {
      if (hand.hovering) this.loseHand(slot);
      hand = this.hands[slot] = emptyHand();
      hand.indexX = det.indexX;
      hand.lastRatio = det.pinch;
    }
    const dt = Math.min(elapsed, 100);
    // Short smoothing suppresses key jitter. As the thumb closes, use the last
    // aimed key to prevent a sideways wobble from sounding its neighbour.
    const shift = det.indexX-hand.indexX;
    const aimTime = Math.abs(shift)>.045 ? 7 : 23;
    const alpha = 1-Math.exp(-dt/aimTime);
    if (Math.abs(shift)>.0025 && (det.pinch>this.profile.soft || !hand.armed || Math.abs(shift)>.055))
      hand.indexX += shift*alpha;
    const x = clamp((hand.indexX - fingertipRange) / (1 - 2 * fingertipRange));
    const inRail = this.onCommand && (hand.commandZone ? det.indexY <= 0.25 : det.indexY < 0.20);
    const zone = inRail ? this.commands[Math.min(this.commands.length-1, Math.floor(clamp(det.indexX)*this.commands.length))] : null;
    if (zone !== hand.commandZone) {
      // A note latch or half-finished dwell never carries across a boundary.
      if (zone && !hand.commandZone && hand.hovering) this.onHover(slot, null);
      this.setCommandHover(slot, null);
      hand.commandZone = zone;
      hand.armed = hand.pressed = false;
      hand.wideSince = hand.narrowSince = null;
      hand.dwell = 0;
    }
    const closure = (hand.lastRatio - det.pinch) / Math.max(0.016, dt / 1000);
    hand.approach = Math.max(hand.approach * Math.exp(-dt / 120), closure);
    // Calibrate gentle contact to each open hand while preserving a distinct
    // release threshold. A decisive or progressively closing pinch sounds on
    // the first qualifying camera frame; stationary borderline poses wait.
    hand.openSpan = Math.max(.78,Math.min(1.30,Math.max(hand.openSpan*(1-dt*.00016),det.pinch)));
    const scale = clamp(hand.openSpan,.88,1.10);
    const release = zone ? .56 : this.profile.release*scale;
    const soft = this.profile.soft*scale;
    if (det.pinch >= release) {
      hand.narrowSince = null;
      hand.wideSince ??= now;
      const hold = now-hand.wideSince;
      if (zone) hand.dwell = clamp(hold/dwellMs);
      const clearRelease = det.pinch >= release+.09 || (closure < -1.4 && hand.lastRatio < release);
      if (zone ? hold>=dwellMs : clearRelease || hold>=16) {
        hand.armed = true;
        hand.pressed = false;
        if (zone) this.setCommandHover(slot,zone);
      }
    } else if (det.pinch <= (zone ? .32 : soft)) {
      hand.wideSince = null;
      hand.narrowSince ??= now;
      const firstContact = det.pinch<=this.profile.touch*scale || closure>.60 || hand.approach>1.5;
      const settled = now-hand.narrowSince >= (zone ? 20 : 16);
      // The command already required a half-second open dwell. Consume a
      // clear closing edge immediately, before a folded finger can cause
      // a one-frame change in the tracking box. Borderline closes still settle.
      const commandEdge = det.pinch<=.30 && hand.lastRatio-det.pinch>=.12;
      const elapsedSinceNote = now-hand.lastStrike;
      if (hand.armed && (zone ? commandEdge || settled : firstContact || settled) && elapsedSinceNote >= (zone ? 100 : 56)) {
        hand.armed = false;
        hand.pressed = true;
        hand.lastStrike = now;
        if (zone) {
          // Consume both simultaneous pinches, but dispatch just one command.
          if (now >= this.nextCommand) {
            this.nextCommand = now + 220;
            this.onCommand(slot, zone);
          }
          this.setCommandHover(slot, null);
        } else {
          this.onStrike(slot, x, clamp(0.48 + hand.approach * 0.04, 0.48, 0.98));
        }
      }
    } else {
      hand.narrowSince = null;
      hand.wideSince = null;
    }
    if (hand !== this.hands[slot] || !this.inputEnabled) return;
    if (!hand.armed && hand.wideSince == null) hand.dwell = 0;
    hand.hovering = true;
    if (!zone) this.onHover(slot, x);
    hand.lastSeen = now;
    hand.indexY = det.indexY;
    hand.wristX = det.wristX;
    hand.wristY = det.wristY;
    hand.lastRatio = det.pinch;
    if (det.label) hand.label = det.label;
  }

  setCommandHover(slot, zone) {
    const hand = this.hands[slot];
    if (hand.commandHover === zone) return;
    hand.commandHover = zone;
    this.onCommandHover(slot, zone);
  }

  setSensitivity(name) {
    if (!Object.hasOwn(sensitivityProfiles,name)) return;
    this.profile = sensitivityProfiles[name];
    this.clearHands();
  }

  setInputEnabled(enabled) {
    if (this.inputEnabled === enabled) return;
    this.inputEnabled = enabled;
    this.clearHands();
  }

  loseHand(slot) {
    const hand = this.hands[slot];
    if (hand.hovering && !hand.commandZone) this.onHover(slot, null);
    this.setCommandHover(slot, null);
    hand.commandZone = null;
    hand.dwell = 0;
    hand.hovering = hand.armed = hand.pressed = false;
    hand.narrowSince = hand.wideSince = null;
  }

  clearHands() {
    this.inputRevision++;
    this.latestTime = null;
    this.hands.forEach((_, slot) => this.loseHand(slot));
    this.hands = [emptyHand(), emptyHand()];
    this.nextCommand = -Infinity;
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawRail(width, height) {
    const ctx = this.ctx;
    const h = height * 0.20;
    const w = width / this.commands.length;
    ctx.save();
    ctx.fillStyle = 'rgba(15,35,30,.55)';
    ctx.fillRect(0, 0, width, h);
    ctx.lineWidth = Math.max(width / 300, height / 400);
    this.commands.forEach((zone, i) => {
      const hand = this.hands.find((item) => item.commandZone === zone);
      const left = i * w;
      if (hand) {
        ctx.fillStyle = hand.armed ? 'rgba(222,219,134,.38)' : 'rgba(216,224,176,.16)';
        ctx.fillRect(left, 0, w, h);
      }
      ctx.fillStyle = hand ? '#ffe7a6' : 'rgba(246,248,219,.45)';
      ctx.fillRect(left, h - ctx.lineWidth, w, ctx.lineWidth);
      if (hand?.dwell > 0) ctx.fillRect(left, h - ctx.lineWidth * 3, w * hand.dwell, ctx.lineWidth * 3);
      if (i > 0) {
        ctx.fillStyle = 'rgba(244,244,229,.48)';
        ctx.fillRect(left, h * 0.18, ctx.lineWidth, h * 0.64);
      }
      // Icons are drawn inside the actual video area even with letterboxing.
      ctx.save();
      ctx.translate(left + w / 2, h / 2);
      const unit = Math.min(h * 0.26, w * 0.23);
      ctx.scale(unit, unit);
      ctx.strokeStyle = ctx.fillStyle = hand?.armed ? '#fff2bd' : '#fffbe5';
      ctx.lineJoin = ctx.lineCap = 'round';
      ctx.lineWidth = 0.15;
      ctx.beginPath();
      if (zone === 'play') {
        ctx.moveTo(-0.52,-0.67); ctx.lineTo(0.49,0); ctx.lineTo(-0.52,0.67); ctx.closePath(); ctx.fill();
      } else if (zone === 'theme') {
        ctx.moveTo(-0.94,0.59); ctx.lineTo(-0.18,-0.51); ctx.lineTo(0.29,0.16);
        ctx.lineTo(0.55,-0.2); ctx.lineTo(0.99,0.59); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0.53,-0.57,0.15,0,Math.PI*2); ctx.fill();
      } else if (zone === 'light') {
        ctx.arc(0,0,.65,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,.65,-Math.PI/2,Math.PI/2); ctx.closePath(); ctx.fill();
      } else if (zone === 'weather') {
        ctx.arc(0,0,.39,0,2*Math.PI);ctx.stroke();ctx.beginPath();
        for(let k=0;k<8;k++){const a=k*Math.PI/4;ctx.moveTo(.55*Math.cos(a),.55*Math.sin(a));ctx.lineTo(.80*Math.cos(a),.80*Math.sin(a));}
        ctx.stroke();
      } else {
        ctx.moveTo(-0.88,-0.45); ctx.lineTo(-0.48,-0.45); ctx.lineTo(0.41,0.45); ctx.lineTo(0.88,0.45);
        ctx.moveTo(0.65,0.21); ctx.lineTo(0.89,0.45); ctx.lineTo(0.65,0.69);
        ctx.moveTo(-0.88,0.45); ctx.lineTo(-0.48,0.45); ctx.lineTo(-0.2,0.17);
        ctx.moveTo(0.2,-0.18); ctx.lineTo(0.47,-0.45); ctx.lineTo(0.88,-0.45);
        ctx.moveTo(0.65,-0.69); ctx.lineTo(0.89,-0.45); ctx.lineTo(0.65,-0.21); ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  draw(detections, slots, width, height) {
    const ctx = this.ctx;
    if (!ctx || !width || !height) return;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    ctx.clearRect(0, 0, width, height);
    if (this.onCommand && this.inputEnabled) this.drawRail(width, height);
    const size = Math.max(width, height) / 180;
    detections.forEach(({points}, index) => {
      const slot = slots[index];
      const xy = (i) => [(1 - points[i].x) * width, points[i].y * height];
      ctx.strokeStyle = ctx.fillStyle = handColors[slot];
      ctx.lineWidth = size * 0.8;
      ctx.lineJoin = ctx.lineCap = 'round';
      ctx.globalAlpha = 0.73;
      ctx.beginPath();
      for (const chain of bones) {
        ctx.moveTo(...xy(chain[0]));
        for (const joint of chain.slice(1)) ctx.lineTo(...xy(joint));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (const tip of [4, 8]) {
        ctx.beginPath(); ctx.arc(...xy(tip), size * 1.65, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.lineWidth = size * 1.05;
      ctx.beginPath(); ctx.arc(...xy(8), size * (this.hands[slot].pressed ? 5 : 3.5), 0, 2 * Math.PI); ctx.stroke();
    });
  }

  stop(announce = true) {
    this.epoch++;
    this.abort?.abort();
    this.opening = null;
    if (this.frame != null) {
      if (this.useVideoFrames) this.video.cancelVideoFrameCallback(this.frame);
      else cancelAnimationFrame(this.frame);
    }
    this.frame = null;
    this.stream?.getVideoTracks()[0]?.removeEventListener('ended', this.onEnd);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
    this.detector?.close();
    this.detector = null;
    this.clearHands();
    window.removeEventListener('pagehide', this.onHide);
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (announce) this.status('off', '隔空演奏已关闭');
  }
}
