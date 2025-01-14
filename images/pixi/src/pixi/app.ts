import { Application, Assets, Graphics, MeshRope, Point } from 'pixi.js';

export class PixiApp {
  private app: Application;
  private points: Point[] = [];
  private strip: MeshRope | null = null;
  private graphics: Graphics | null = null;
  private count: number = 0;
  private readonly ropeLength: number = 45;

  constructor() {
    this.app = new Application();
  }

  async init(): Promise<void> {
    // Initialize the application
    await this.app.init({ 
      resizeTo: window,
      backgroundColor: 0x000000 
    });
    document.body.appendChild(this.app.canvas);

    // Load the snake texture
    const texture = await Assets.load('https://pixijs.com/assets/snake.png');

    // Build rope points
    for (let i = 0; i < 25; i++) {
      this.points.push(new Point(i * this.ropeLength, 0));
    }

    // Create the snake MeshRope
    this.strip = new MeshRope({ texture, points: this.points });
    this.strip.x = -40;
    this.strip.y = 300;
    this.app.stage.addChild(this.strip);

    // Setup graphics for rendering points
    this.graphics = new Graphics();
    this.graphics.x = this.strip.x;
    this.graphics.y = this.strip.y;
    this.app.stage.addChild(this.graphics);

    // Start animation loop
    this.app.ticker.add(() => this.update());
  }

  private update(): void {
    this.count += 0.1;

    // Animate snake points
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].y = Math.sin(i * 0.5 + this.count) * 30;
      this.points[i].x = i * this.ropeLength + Math.cos(i * 0.3 + this.count) * 20;
    }
    this.renderPoints();
  }

  private renderPoints(): void {
    if (!this.graphics) return;

    this.graphics.clear();
    this.graphics.moveTo(this.points[0].x, this.points[0].y);

    // Draw lines between points
    for (let i = 1; i < this.points.length; i++) {
      this.graphics.lineTo(this.points[i].x, this.points[i].y);
      this.graphics.stroke({ width: 2, color: 0xffc2c2 });
    }

    // Draw circles at points
    for (let i = 1; i < this.points.length; i++) {
      this.graphics.drawCircle(this.points[i].x, this.points[i].y, 10);
      this.graphics.fill({ color: 0xff0022 });
      this.graphics.stroke({ width: 2, color: 0xffc2c2 });
    }
  }

  public cleanup(): void {
    this.app.destroy();
  }
} 