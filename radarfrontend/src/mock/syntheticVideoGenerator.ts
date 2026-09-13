import { Camera, Tripwire } from '../types';

interface SimulatedActor {
  id: string;
  type: 'PERSON' | 'VEHICLE';
  subType?: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
  vx: number;
  vy: number;
  width: number;
  height: number;
  state: 'NORMAL' | 'CRAWLING' | 'LOITERING' | 'BREACHING';
  confidence: number;
  plateNumber?: string;
  plateStatus?: 'WANTED' | 'AUTHORIZED' | 'SUSPICIOUS';
  frsName?: string;
  frsMatch?: number;
  trail: Array<{ x: number; y: number }>;
}

export class VideoStreamSimulator {
  private actors: SimulatedActor[] = [];
  private frameCount: number = 0;
  private camera: Camera;
  private isBreached: boolean = false;
  private onIntrusionCallback?: (details: string) => void;

  constructor(camera: Camera, onIntrusion?: (details: string) => void) {
    this.camera = camera;
    this.onIntrusionCallback = onIntrusion;
    this.initActors();
  }

  public updateCamera(camera: Camera) {
    this.camera = camera;
  }

  private initActors() {
    this.actors = [];
    if (this.camera.id === 'CAM-TR-01') {
      // Perimeter Fence: 1 crawling infiltrator near fence, 1 border patrol officer
      this.actors.push({
        id: 'HUM-802',
        type: 'PERSON',
        subType: 'Infiltrator',
        x: 0.28,
        y: 0.65,
        vx: 0.0006,
        vy: 0.0002,
        width: 0.08,
        height: 0.07,
        state: 'CRAWLING',
        confidence: 0.978,
        frsName: 'Subject X-Ray (WL-902)',
        frsMatch: 0.867,
        trail: []
      });
      this.actors.push({
        id: 'BSF-142',
        type: 'PERSON',
        subType: 'Patrol Officer',
        x: 0.82,
        y: 0.60,
        vx: -0.0005,
        vy: 0.0001,
        width: 0.04,
        height: 0.12,
        state: 'NORMAL',
        confidence: 0.992,
        frsName: 'SI Rajesh Verma (BSF)',
        frsMatch: 0.994,
        trail: []
      });
    } else if (this.camera.id === 'CAM-TR-02') {
      // Thermal FLIR: 2 heat signatures in wild vegetation
      this.actors.push({
        id: 'THM-41',
        type: 'PERSON',
        subType: 'Thermal Target',
        x: 0.45,
        y: 0.58,
        vx: 0.0004,
        vy: -0.0001,
        width: 0.05,
        height: 0.09,
        state: 'LOITERING',
        confidence: 0.915,
        trail: []
      });
      this.actors.push({
        id: 'THM-42',
        type: 'PERSON',
        subType: 'Thermal Target 2',
        x: 0.52,
        y: 0.59,
        vx: 0.0003,
        vy: 0.0001,
        width: 0.04,
        height: 0.08,
        state: 'LOITERING',
        confidence: 0.887,
        trail: []
      });
    } else if (this.camera.id === 'CAM-CH-01') {
      // Checkpost: Bolero truck at barrier with ANPR
      this.actors.push({
        id: 'VEH-901',
        type: 'VEHICLE',
        subType: 'Bolero Pickup',
        x: 0.46,
        y: 0.55,
        vx: 0.0002,
        vy: 0.0003,
        width: 0.28,
        height: 0.24,
        state: 'NORMAL',
        confidence: 0.968,
        plateNumber: 'JK-02-AZ-8841',
        plateStatus: 'WANTED',
        trail: []
      });
      this.actors.push({
        id: 'HUM-GUARD',
        type: 'PERSON',
        subType: 'Checkpost Sentry',
        x: 0.25,
        y: 0.62,
        vx: 0.0001,
        vy: -0.0001,
        width: 0.045,
        height: 0.14,
        state: 'NORMAL',
        confidence: 0.985,
        frsName: 'Sentry Naik Ramesh',
        frsMatch: 0.988,
        trail: []
      });
    } else if (this.camera.id === 'CAM-RB-01') {
      // Border Road: tractor and farmer
      this.actors.push({
        id: 'VEH-330',
        type: 'VEHICLE',
        subType: 'Tractor Swaraj',
        x: 0.35,
        y: 0.62,
        vx: 0.0008,
        vy: 0.0001,
        width: 0.22,
        height: 0.18,
        state: 'NORMAL',
        confidence: 0.947,
        plateNumber: 'PB-06-K-4102',
        plateStatus: 'AUTHORIZED',
        trail: []
      });
    } else {
      // Default: 1 person patrol
      this.actors.push({
        id: 'PATROL-01',
        type: 'PERSON',
        subType: 'Armed Sentry',
        x: 0.4,
        y: 0.65,
        vx: 0.0004,
        vy: 0,
        width: 0.04,
        height: 0.11,
        state: 'NORMAL',
        confidence: 0.96,
        trail: []
      });
    }
  }

  // Check if an actor crossed any active tripwire
  private checkTripwireCollisions() {
    if (!this.camera.tripwires || this.camera.tripwires.length === 0) return;

    for (const tw of this.camera.tripwires) {
      if (!tw.enabled || tw.points.length < 2) continue;
      const p1 = tw.points[0];
      const p2 = tw.points[1];

      for (const actor of this.actors) {
        // Line intersection check with actor center
        const cx = actor.x + actor.width / 2;
        const cy = actor.y + actor.height / 2;

        // Distance from point to line segment
        const A = cx - p1.x;
        const B = cy - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) {
          xx = p1.x;
          yy = p1.y;
        } else if (param > 1) {
          xx = p2.x;
          yy = p2.y;
        } else {
          xx = p1.x + param * C;
          yy = p1.y + param * D;
        }

        const dx = cx - xx;
        const dy = cy - yy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.04 && actor.state === 'CRAWLING') {
          this.isBreached = true;
          actor.state = 'BREACHING';
          tw.triggerCount++;
          if (this.onIntrusionCallback) {
            this.onIntrusionCallback(`Intrusion at ${this.camera.name}: Actor ${actor.id} crossed ${tw.name}`);
          }
        }
      }
    }
  }

  // Render complete synthetic frame onto HTML5 canvas
  public render(ctx: CanvasRenderingContext2D, width: number, height: number, showOverlays: boolean = true) {
    this.frameCount++;

    // 1. Draw Background Environment
    this.drawBackground(ctx, width, height);

    // 2. Update and Draw Simulated Actors
    this.updateActors();
    this.drawActors(ctx, width, height, showOverlays);

    // 3. Draw Virtual Tripwires & ROIs
    this.drawTripwires(ctx, width, height);

    // 4. Draw Tactical Military Camera OSD & HUD
    this.drawTacticalOSD(ctx, width, height);

    // 5. Collision checks
    if (this.frameCount % 30 === 0) {
      this.checkTripwireCollisions();
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const isThermal = this.camera.visionMode === 'THERMAL_FLIR';
    const isNightVision = this.camera.visionMode === 'NIGHT_VISION';

    if (isThermal) {
      // Thermal FLIR background (dark gradient with high-contrast temperature bands)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0a0d14');
      grad.addColorStop(0.5, '#162235');
      grad.addColorStop(0.7, '#24344d');
      grad.addColorStop(1, '#0e1824');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Thermal contour terrain
      ctx.fillStyle = '#1e2e46';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.55);
      ctx.bezierCurveTo(width * 0.3, height * 0.50, width * 0.7, height * 0.58, width, height * 0.52);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Thermal noise specks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 40; i++) {
        const rx = (Math.sin(this.frameCount * 0.05 + i) * 0.5 + 0.5) * width;
        const ry = (Math.cos(this.frameCount * 0.03 + i) * 0.5 + 0.5) * height;
        ctx.fillRect(rx, ry, 2, 2);
      }
      return;
    }

    if (isNightVision) {
      // Phosphor Green NVG background
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#021a08');
      grad.addColorStop(0.5, '#042b10');
      grad.addColorStop(1, '#021807');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Terrain
      ctx.fillStyle = '#063814';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.6);
      ctx.lineTo(width, height * 0.55);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Vignette effect for night scope
      const radial = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.65);
      radial.addColorStop(0, 'rgba(0,0,0,0)');
      radial.addColorStop(1, 'rgba(0, 20, 5, 0.75)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Standard Optical Daylight / Dusk
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGrad.addColorStop(0, '#1c2838');
    skyGrad.addColorStop(0.5, '#2e3d52');
    skyGrad.addColorStop(1, '#4a5768');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.6);

    // Mountain silhouettes in background
    ctx.fillStyle = '#1e2633';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.55);
    ctx.lineTo(width * 0.25, height * 0.42);
    ctx.lineTo(width * 0.5, height * 0.52);
    ctx.lineTo(width * 0.8, height * 0.38);
    ctx.lineTo(width, height * 0.50);
    ctx.lineTo(width, height * 0.6);
    ctx.lineTo(0, height * 0.6);
    ctx.fill();

    // Ground / Border dirt track
    const groundGrad = ctx.createLinearGradient(0, height * 0.55, 0, height);
    groundGrad.addColorStop(0, '#2d3329');
    groundGrad.addColorStop(0.4, '#383b2a');
    groundGrad.addColorStop(1, '#24261b');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height * 0.55, width, height * 0.45);

    // Border Security Concertina Barbed Wire & Fence Posts
    ctx.strokeStyle = '#5a626e';
    ctx.lineWidth = 2;
    const fenceY = height * 0.68;

    // Fence Posts
    for (let x = 20; x < width; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, fenceY - 45);
      ctx.lineTo(x, fenceY + 25);
      ctx.stroke();
    }

    // Horizontal Wire Strands
    for (let offset = -40; offset <= 20; offset += 15) {
      ctx.beginPath();
      ctx.moveTo(0, fenceY + offset);
      ctx.lineTo(width, fenceY + offset - 5);
      ctx.stroke();
    }

    // Concertina razor coils
    ctx.strokeStyle = 'rgba(180, 190, 205, 0.4)';
    ctx.lineWidth = 1.5;
    for (let x = 10; x < width; x += 22) {
      ctx.beginPath();
      ctx.arc(x, fenceY - 20, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private updateActors() {
    for (const actor of this.actors) {
      // Record trail
      if (this.frameCount % 5 === 0) {
        actor.trail.push({ x: actor.x + actor.width / 2, y: actor.y + actor.height / 2 });
        if (actor.trail.length > 12) actor.trail.shift();
      }

      // Movement
      actor.x += actor.vx;
      actor.y += actor.vy;

      // Bounce boundaries
      if (actor.x < 0.05 || actor.x > 0.85) actor.vx *= -1;
      if (actor.y < 0.45 || actor.y > 0.78) actor.vy *= -1;
    }
  }

  private drawActors(ctx: CanvasRenderingContext2D, width: number, height: number, showOverlays: boolean) {
    const isThermal = this.camera.visionMode === 'THERMAL_FLIR';
    const isNightVision = this.camera.visionMode === 'NIGHT_VISION';

    for (const actor of this.actors) {
      const ax = actor.x * width;
      const ay = actor.y * height;
      const aw = actor.width * width;
      const ah = actor.height * height;

      // Draw Actor Graphic
      if (isThermal) {
        // High-temperature FLIR Heat Glow
        const glow = ctx.createRadialGradient(ax + aw / 2, ay + ah / 2, 2, ax + aw / 2, ay + ah / 2, aw * 1.1);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.3, '#ffcc00');
        glow.addColorStop(0.7, '#ff3300');
        glow.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(ax - aw * 0.5, ay - ah * 0.2, aw * 2, ah * 1.4);
      } else if (isNightVision) {
        // Night Vision Silhouette
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(ax, ay, aw, ah);
      } else {
        // Optical representation
        if (actor.type === 'VEHICLE') {
          ctx.fillStyle = actor.plateStatus === 'WANTED' ? '#4a151b' : '#334155';
          ctx.fillRect(ax, ay, aw, ah);
          // Windows
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(ax + aw * 0.15, ay + ah * 0.15, aw * 0.7, ah * 0.35);
          // Headlights
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(ax + 5, ay + ah * 0.65, 8, 8);
          ctx.fillRect(ax + aw - 13, ay + ah * 0.65, 8, 8);
        } else {
          // Human silhouette
          ctx.fillStyle = actor.state === 'CRAWLING' ? '#1c1917' : '#0f172a';
          ctx.fillRect(ax, ay, aw, ah);
          // Head
          ctx.beginPath();
          ctx.arc(ax + aw / 2, ay - 6, aw * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw AI Bounding Box & Annotations if enabled
      if (showOverlays) {
        const isBreached = actor.state === 'BREACHING' || actor.plateStatus === 'WANTED';
        const boxColor = isBreached ? '#ff2a51' : '#00e5ff';

        // Draw Bounding Box with Corner Brackets
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(ax, ay, aw, ah);

        // Corner accents
        const cornerLen = Math.min(aw, ah) * 0.25;
        ctx.lineWidth = 3;
        // TL
        ctx.beginPath();
        ctx.moveTo(ax, ay + cornerLen);
        ctx.lineTo(ax, ay);
        ctx.lineTo(ax + cornerLen, ay);
        ctx.stroke();
        // TR
        ctx.beginPath();
        ctx.moveTo(ax + aw - cornerLen, ay);
        ctx.lineTo(ax + aw, ay);
        ctx.lineTo(ax + aw, ay + cornerLen);
        ctx.stroke();
        // BR
        ctx.beginPath();
        ctx.moveTo(ax + aw, ay + ah - cornerLen);
        ctx.lineTo(ax + aw, ay + ah);
        ctx.lineTo(ax + aw - cornerLen, ay + ah);
        ctx.stroke();
        // BL
        ctx.beginPath();
        ctx.moveTo(ax + cornerLen, ay + ah);
        ctx.lineTo(ax, ay + ah);
        ctx.lineTo(ax, ay + ah - cornerLen);
        ctx.stroke();

        // Label Badge Tag
        ctx.fillStyle = isBreached ? 'rgba(255, 42, 81, 0.92)' : 'rgba(0, 229, 255, 0.88)';
        ctx.fillRect(ax, ay - 22, aw > 140 ? aw : 140, 20);

        ctx.fillStyle = '#05070a';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        const label = `${actor.type}: ${actor.subType || actor.id} [${(actor.confidence * 100).toFixed(1)}%]`;
        ctx.fillText(label, ax + 4, ay - 8);

        // ANPR Plate Overlay
        if (actor.plateNumber && this.camera.aiFeatures.anpr) {
          const plateW = 150;
          const plateH = 26;
          const px = ax + (aw - plateW) / 2;
          const py = ay + ah + 6;

          ctx.fillStyle = actor.plateStatus === 'WANTED' ? '#ff2a51' : '#1e293b';
          ctx.fillRect(px, py, plateW, plateH);
          ctx.strokeStyle = actor.plateStatus === 'WANTED' ? '#ffffff' : '#00e5ff';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(px, py, plateW, plateH);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.fillText(`ANPR: ${actor.plateNumber}`, px + 8, py + 18);
        }

        // FRS Face Match Overlay
        if (actor.frsName && this.camera.aiFeatures.faceRecognition) {
          const frsW = 160;
          const frsH = 24;
          const fx = ax - 10;
          const fy = ay - 48;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(fx, fy, frsW, frsH);
          ctx.strokeStyle = actor.frsMatch && actor.frsMatch > 0.9 ? '#00e676' : '#ffb020';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(fx, fy, frsW, frsH);

          ctx.fillStyle = '#ffffff';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`FRS: ${actor.frsName}`, fx + 6, fy + 16);
        }

        // Motion vector trail
        if (actor.trail.length > 1) {
          ctx.strokeStyle = isBreached ? 'rgba(255, 42, 81, 0.6)' : 'rgba(0, 229, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          actor.trail.forEach((t, i) => {
            if (i === 0) ctx.moveTo(t.x * width, t.y * height);
            else ctx.lineTo(t.x * width, t.y * height);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  }

  private drawTripwires(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.camera.tripwires) return;

    for (const tw of this.camera.tripwires) {
      if (!tw.enabled || tw.points.length < 2) continue;

      const p1 = tw.points[0];
      const p2 = tw.points[1];
      const x1 = p1.x * width;
      const y1 = p1.y * height;
      const x2 = p2.x * width;
      const y2 = p2.y * height;

      // Glow effect
      ctx.save();
      ctx.shadowColor = this.isBreached ? '#ff2a51' : '#00e5ff';
      ctx.shadowBlur = 10;

      ctx.strokeStyle = this.isBreached ? '#ff2a51' : '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();

      // Tripwire Endpoint Nodes
      [ { x: x1, y: y1 }, { x: x2, y: y2 } ].forEach((pt) => {
        ctx.fillStyle = this.isBreached ? '#ff2a51' : '#00e5ff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Direction Arrow & Tag
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.fillStyle = this.isBreached ? 'rgba(255, 42, 81, 0.9)' : 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(midX - 70, midY - 18, 140, 20);
      ctx.strokeStyle = this.isBreached ? '#ffffff' : '#00e5ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - 70, midY - 18, 140, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`TRIPWIRE: ${tw.name.toUpperCase()}`, midX - 65, midY - 4);
    }
  }

  private drawTacticalOSD(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Top Bar OSD
    ctx.fillStyle = 'rgba(7, 11, 18, 0.75)';
    ctx.fillRect(0, 0, width, 28);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    ctx.fillText(`CAM: ${this.camera.id} [${this.camera.bopName}]`, 10, 18);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${timeStr} IST`, width / 2 - 45, 18);

    // Live Indicator & FPS
    ctx.fillStyle = '#ff2a51';
    ctx.beginPath();
    ctx.arc(width - 70, 14, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`REC ${this.camera.fps}fps`, width - 60, 18);

    // Bottom Bar OSD: Coordinates & AI Mode
    ctx.fillStyle = 'rgba(7, 11, 18, 0.75)';
    ctx.fillRect(0, height - 24, width, 24);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    const lat = this.camera.coordinates[0].toFixed(4);
    const lng = this.camera.coordinates[1].toFixed(4);
    ctx.fillText(`GPS: ${lat}°N, ${lng}°E | HDG: ${this.camera.fovDirection}° | RES: ${this.camera.resolution}`, 10, height - 8);

    // Status Mode Badge
    ctx.fillStyle = this.camera.visionMode === 'THERMAL_FLIR' ? '#ff5722' : this.camera.visionMode === 'NIGHT_VISION' ? '#00e676' : '#00e5ff';
    ctx.fillText(`AI: ACTIVE [YOLOv8 + FRS + ANPR]`, width - 210, height - 8);

    // If intrusion active, flash banner
    if (this.isBreached && Math.floor(this.frameCount / 15) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 42, 81, 0.85)';
      ctx.fillRect(width / 2 - 140, 36, 280, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('! CRITICAL PERIMETER BREACH !', width / 2 - 120, 53);
    }
  }
}
