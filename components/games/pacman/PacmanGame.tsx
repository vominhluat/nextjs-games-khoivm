"use client";

import { useEffect, useRef } from "react";
import styles from "./PacmanGame.module.css";

const TILE = 32;
const ROWS = 23;
const COLS = 21;

type DirName = "none" | "left" | "right" | "up" | "down";

interface Dir {
  x: number;
  y: number;
  name: DirName;
}

interface Tile {
  col: number;
  row: number;
}

interface Movable {
  x: number;
  y: number;
}

interface PacState extends Movable {
  dir: Dir;
  want: Dir;
  speed: number;
  mouth: number;
}

interface GhostState extends Movable {
  name: string;
  homeX: number;
  homeY: number;
  dir: Dir;
  speed: number;
  color: string;
  scatter: Tile;
  eatenCooldown: number;
  decisionTile: string;
}

type GameState = "start" | "ready" | "playing" | "paused" | "gameover";

const DIRS: Record<DirName, Dir> = {
  none: { x: 0, y: 0, name: "none" },
  left: { x: -1, y: 0, name: "left" },
  right: { x: 1, y: 0, name: "right" },
  up: { x: 0, y: -1, name: "up" },
  down: { x: 0, y: 1, name: "down" },
};

const BASE_MAP = [
  "#####################",
  "#.........#.........#",
  "#.###.###.#.###.###.#",
  "#o###.###.#.###.###o#",
  "#...................#",
  "#.###.#.#####.#.###.#",
  "#.....#...#...#.....#",
  "#####.###.#.###.#####",
  "    #.#.......#.#    ",
  "#####.#.## ##.#.#####",
  "#.......#GGG#.......#",
  "#####.#.#####.#.#####",
  "    #.#.......#.#    ",
  "#####.#.#####.#.#####",
  "#.........#.........#",
  "#.###.###.#.###.###.#",
  "#o..#.....P.....#..o#",
  "###.#.#.#####.#.#.###",
  "#.....#...#...#.....#",
  "#.#######.#.#######.#",
  "#...................#",
  "#.#################.#",
  "#####################",
];

export default function PacmanGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const livesRef = useRef<HTMLSpanElement>(null);
  const levelRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const wrapElRef = wrapRef.current;
    const canvasElRef = canvasRef.current;
    const scoreElRef = scoreRef.current;
    const livesElRef = livesRef.current;
    const levelElRef = levelRef.current;
    const overlayElRef = overlayRef.current;
    const startBtnElRef = startBtnRef.current;
    const ctxRef = canvasElRef?.getContext("2d") ?? null;
    if (
      !wrapElRef ||
      !canvasElRef ||
      !scoreElRef ||
      !livesElRef ||
      !levelElRef ||
      !overlayElRef ||
      !startBtnElRef ||
      !ctxRef
    ) {
      return;
    }

    // Re-bind to non-nullable consts so nested closures below don't
    // re-widen these to `T | null` (TS doesn't retain narrowing across
    // closures for variables declared before the guard above).
    const wrapEl = wrapElRef;
    const canvas = canvasElRef;
    const scoreEl = scoreElRef;
    const livesEl = livesElRef;
    const levelEl = levelElRef;
    const overlayEl = overlayElRef;
    const startBtnEl = startBtnElRef;
    const ctx = ctxRef;

    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;

    let map: string[][] = [];
    let pellets = 0;
    let score = 0;
    let lives = 3;
    let level = 1;
    let gameState: GameState = "start";
    let frightenedUntil = 0;
    let lastTime = 0;
    let rafId: number | undefined;

    let pac: PacState = {
      x: 0,
      y: 0,
      dir: DIRS.none,
      want: DIRS.none,
      speed: 0,
      mouth: 0,
    };
    let ghosts: GhostState[] = [];

    function cloneMap(): string[][] {
      return BASE_MAP.map((row) => row.split(""));
    }

    function tileCenter(col: number, row: number) {
      return {
        x: col * TILE + TILE / 2,
        y: row * TILE + TILE / 2,
      };
    }

    function pixelToTile(x: number, y: number): Tile {
      return {
        col: Math.floor(x / TILE),
        row: Math.floor(y / TILE),
      };
    }

    function findTiles(ch: string): Tile[] {
      const list: Tile[] = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (map[r][c] === ch) list.push({ col: c, row: r });
        }
      }
      return list;
    }

    function isWall(col: number, row: number): boolean {
      if (row < 0 || row >= ROWS) return true;
      if (col < 0 || col >= COLS) return false; // cho phép đường hầm ngang
      return map[row][col] === "#";
    }

    function isWalkable(col: number, row: number): boolean {
      return !isWall(col, row);
    }

    function reverseDir(dir: Dir): Dir {
      if (dir.name === "left") return DIRS.right;
      if (dir.name === "right") return DIRS.left;
      if (dir.name === "up") return DIRS.down;
      if (dir.name === "down") return DIRS.up;
      return DIRS.none;
    }

    function snapToCenter(entity: Movable) {
      const t = pixelToTile(entity.x, entity.y);
      const center = tileCenter(t.col, t.row);
      entity.x = center.x;
      entity.y = center.y;
    }

    function tileCenterFor(entity: Movable) {
      const t = pixelToTile(entity.x, entity.y);
      return tileCenter(t.col, t.row);
    }

    function nearCenter(entity: Movable, tolerance = 5): boolean {
      const center = tileCenterFor(entity);
      return (
        Math.abs(entity.x - center.x) < tolerance &&
        Math.abs(entity.y - center.y) < tolerance
      );
    }

    function canMove(entity: Movable, dir: Dir): boolean {
      if (dir.name === "none") return true;
      const t = pixelToTile(entity.x, entity.y);
      const nc = t.col + dir.x;
      const nr = t.row + dir.y;
      return isWalkable(nc, nr);
    }

    function wrap(entity: Movable) {
      if (entity.x < -TILE / 2) entity.x = COLS * TILE + TILE / 2;
      if (entity.x > COLS * TILE + TILE / 2) entity.x = -TILE / 2;
    }

    function countPellets(): number {
      let total = 0;
      for (const row of map) {
        for (const ch of row) {
          if (ch === "." || ch === "o") total++;
        }
      }
      return total;
    }

    function resetLevel(fullReset = false) {
      map = cloneMap();

      const pStart = findTiles("P")[0] || { col: 10, row: 16 };
      const gStarts = findTiles("G");

      map[pStart.row][pStart.col] = " ";
      for (const g of gStarts) map[g.row][g.col] = " ";

      const pCenter = tileCenter(pStart.col, pStart.row);
      pac = {
        x: pCenter.x,
        y: pCenter.y,
        dir: DIRS.left,
        want: DIRS.left,
        speed: 102 + (level - 1) * 5,
        mouth: 0,
      };

      const ghostColors = ["#ff5c7a", "#56d7ff", "#ffb85c"];
      const names = ["Ruby", "Aqua", "Sunny"];
      ghosts = gStarts.map((g, idx) => {
        const center = tileCenter(g.col, g.row);
        return {
          name: names[idx] || "Ghost",
          x: center.x,
          y: center.y,
          homeX: center.x,
          homeY: center.y,
          dir: [DIRS.left, DIRS.up, DIRS.right][idx] || DIRS.left,
          speed: 80 + (level - 1) * 5,
          color: ghostColors[idx] || "#e6e6e6",
          scatter: [
            { col: 1, row: 1 },
            { col: COLS - 2, row: 1 },
            { col: COLS - 2, row: ROWS - 2 },
          ][idx] || { col: 1, row: ROWS - 2 },
          eatenCooldown: 0,
          decisionTile: "",
        };
      });

      pellets = countPellets();
      frightenedUntil = 0;
      if (fullReset) updateStats();
    }

    function newGame() {
      score = 0;
      lives = 3;
      level = 1;
      gameState = "playing";
      lastTime = performance.now();
      overlayEl.classList.add(styles.overlayHidden);
      resetLevel(true);
      rafId = requestAnimationFrame(loop);
    }

    function loseLife() {
      lives--;
      updateStats();

      if (lives <= 0) {
        gameState = "gameover";
        showOverlay(
          "Hết mạng!",
          `Điểm của anh: ${score}. Bấm “Chơi lại” để bắt đầu ván mới.`,
          "Chơi lại",
        );
        return;
      }

      gameState = "ready";
      showOverlay(
        "Mất 1 mạng",
        `Còn ${lives} mạng. Bấm tiếp để chơi lại từ vị trí xuất phát.`,
        "Tiếp tục",
      );
      resetPositionsOnly();
    }

    function resetPositionsOnly() {
      const pStart = { col: 10, row: 16 };
      const c = tileCenter(pStart.col, pStart.row);
      pac.x = c.x;
      pac.y = c.y;
      pac.dir = DIRS.left;
      pac.want = DIRS.left;

      ghosts.forEach((g) => {
        g.x = g.homeX;
        g.y = g.homeY;
        g.dir = DIRS.left;
        g.eatenCooldown = 0;
        g.decisionTile = "";
      });

      frightenedUntil = 0;
    }

    function nextLevel() {
      level++;
      updateStats();
      gameState = "ready";
      showOverlay(
        `Qua màn ${level - 1}!`,
        `Sẵn sàng màn ${level}. Tốc độ sẽ tăng nhẹ.`,
        "Chơi tiếp",
      );
      resetLevel(false);
    }

    function showOverlay(title: string, text: string, btnText: string) {
      overlayEl.innerHTML = `
        <div class="${styles.card}">
          <h1>${title}</h1>
          <p>${text}</p>
          <p>Điều khiển bằng phím mũi tên / WASD hoặc nút cảm ứng.</p>
          <button class="${styles.btn}" id="againBtn">${btnText}</button>
        </div>
      `;
      overlayEl.classList.remove(styles.overlayHidden);
      overlayEl
        .querySelector<HTMLButtonElement>("#againBtn")
        ?.addEventListener("click", () => {
          if (gameState === "gameover") {
            newGame();
          } else {
            gameState = "playing";
            overlayEl.classList.add(styles.overlayHidden);
            lastTime = performance.now();
            rafId = requestAnimationFrame(loop);
          }
        });
    }

    function updateStats() {
      scoreEl.textContent = String(score);
      livesEl.textContent = String(lives);
      levelEl.textContent = String(level);
    }

    function eatPellet() {
      const t = pixelToTile(pac.x, pac.y);
      if (t.row < 0 || t.row >= ROWS || t.col < 0 || t.col >= COLS) return;

      const ch = map[t.row][t.col];
      if (ch === "." || ch === "o") {
        map[t.row][t.col] = " ";
        pellets--;
        score += ch === "o" ? 50 : 10;
        if (ch === "o") frightenedUntil = performance.now() + 7200;
        updateStats();

        if (pellets <= 0) nextLevel();
      }
    }

    function updatePac(dt: number) {
      if (nearCenter(pac)) {
        const wantsTurn = pac.want.name !== pac.dir.name;

        if (canMove(pac, pac.want)) {
          if (wantsTurn) snapToCenter(pac);
          pac.dir = pac.want;
        }

        if (!canMove(pac, pac.dir)) {
          snapToCenter(pac);
          pac.dir = DIRS.none;
        }
      }

      const center = tileCenterFor(pac);
      if (pac.dir.x !== 0) {
        pac.y = center.y;
      } else if (pac.dir.y !== 0) {
        pac.x = center.x;
      }

      pac.x += pac.dir.x * pac.speed * dt;
      pac.y += pac.dir.y * pac.speed * dt;
      pac.mouth += dt * 10;
      wrap(pac);
      eatPellet();
    }

    function targetForGhost(g: GhostState, index: number): Tile {
      const t = pixelToTile(pac.x, pac.y);

      if (index === 0) return t;

      if (index === 1) {
        return {
          col: Math.max(0, Math.min(COLS - 1, t.col + pac.dir.x * 4)),
          row: Math.max(0, Math.min(ROWS - 1, t.row + pac.dir.y * 4)),
        };
      }

      if (index === 2) {
        const far = Math.abs(g.x - pac.x) + Math.abs(g.y - pac.y) > TILE * 7;
        return far ? t : g.scatter;
      }

      return t;
    }

    function nextTileScore(entity: Movable, dir: Dir, target: Tile): number {
      const t = pixelToTile(entity.x, entity.y);
      const nc = t.col + dir.x;
      const nr = t.row + dir.y;
      return (nc - target.col) ** 2 + (nr - target.row) ** 2;
    }

    function chooseGhostDirection(g: GhostState, index: number): Dir {
      const frightened = performance.now() < frightenedUntil;
      const reverse = reverseDir(g.dir);
      let options = [DIRS.left, DIRS.right, DIRS.up, DIRS.down].filter(
        (d) => {
          if (d.name === reverse.name && Math.random() > 0.08) return false;
          return canMove(g, d);
        },
      );

      if (options.length === 0) {
        options = [reverse].filter((d) => canMove(g, d));
      }
      if (options.length === 0) return DIRS.none;

      if (frightened) {
        const pTile = pixelToTile(pac.x, pac.y);
        options.sort((a, b) => {
          const ta = nextTileScore(g, a, pTile);
          const tb = nextTileScore(g, b, pTile);
          return tb - ta; // chạy xa người chơi
        });
        return options[0];
      }

      const target = targetForGhost(g, index);
      options.sort((a, b) => {
        const da = nextTileScore(g, a, target);
        const db = nextTileScore(g, b, target);
        return da - db;
      });

      return options[0];
    }

    function updateGhosts(dt: number) {
      ghosts.forEach((g, index) => {
        if (g.eatenCooldown > 0) {
          g.eatenCooldown -= dt;
          if (g.eatenCooldown <= 0) {
            g.x = g.homeX;
            g.y = g.homeY;
            g.decisionTile = "";
          }
        }

        const t = pixelToTile(g.x, g.y);
        const tileKey = `${t.col},${t.row}`;
        if (nearCenter(g) && g.decisionTile !== tileKey) {
          snapToCenter(g);
          g.dir = chooseGhostDirection(g, index);
          g.decisionTile = tileKey;
        } else if (!nearCenter(g)) {
          g.decisionTile = "";
        }

        const frightened = performance.now() < frightenedUntil;
        const speed = frightened ? g.speed * 0.78 : g.speed;
        const center = tileCenterFor(g);
        if (g.dir.x !== 0) {
          g.y = center.y;
        } else if (g.dir.y !== 0) {
          g.x = center.x;
        }
        g.x += g.dir.x * speed * dt;
        g.y += g.dir.y * speed * dt;
        wrap(g);
      });
    }

    function checkCollisions() {
      const frightened = performance.now() < frightenedUntil;
      for (const g of ghosts) {
        const d = Math.hypot(pac.x - g.x, pac.y - g.y);
        if (d < TILE * 0.58) {
          if (frightened) {
            score += 200;
            updateStats();
            g.x = g.homeX;
            g.y = g.homeY;
            g.dir = DIRS.left;
            g.eatenCooldown = 0.5;
            g.decisionTile = "";
          } else {
            loseLife();
          }
          break;
        }
      }
    }

    function roundRect(
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      fill: string,
    ) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    function drawMaze() {
      ctx.fillStyle = "#02050b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const ch = map[r][c];
          const x = c * TILE;
          const y = r * TILE;

          if (ch === "#") {
            const pad = 3;
            const radius = 8;
            roundRect(
              x + pad,
              y + pad,
              TILE - pad * 2,
              TILE - pad * 2,
              radius,
              "#2468ff",
            );
            ctx.strokeStyle = "rgba(163, 207, 255, .28)";
            ctx.lineWidth = 1;
            ctx.strokeRect(
              x + pad + 0.5,
              y + pad + 0.5,
              TILE - pad * 2 - 1,
              TILE - pad * 2 - 1,
            );
          } else if (ch === ".") {
            ctx.beginPath();
            ctx.fillStyle = "#f6dfad";
            ctx.arc(x + TILE / 2, y + TILE / 2, 3.2, 0, Math.PI * 2);
            ctx.fill();
          } else if (ch === "o") {
            const pulse = 1 + Math.sin(performance.now() / 140) * 0.15;
            ctx.beginPath();
            ctx.fillStyle = "#fff2a6";
            ctx.arc(x + TILE / 2, y + TILE / 2, 8 * pulse, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    function drawPac() {
      const open = 0.18 + Math.abs(Math.sin(pac.mouth)) * 0.22;
      let angle = 0;
      if (pac.dir.name === "left") angle = Math.PI;
      if (pac.dir.name === "up") angle = -Math.PI / 2;
      if (pac.dir.name === "down") angle = Math.PI / 2;

      ctx.save();
      ctx.translate(pac.x, pac.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, TILE * 0.42, open, Math.PI * 2 - open);
      ctx.closePath();
      ctx.fillStyle = "#ffd84d";
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#2b2300";
      ctx.arc(TILE * 0.08, -TILE * 0.22, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawGhost(g: GhostState) {
      const frightened = performance.now() < frightenedUntil;
      const body = frightened ? "#354bff" : g.color;
      const flash =
        frightened &&
        frightenedUntil - performance.now() < 2000 &&
        Math.floor(performance.now() / 180) % 2 === 0;

      ctx.save();
      ctx.translate(g.x, g.y);

      ctx.fillStyle = flash ? "#f7fbff" : body;
      ctx.beginPath();
      ctx.arc(0, -4, TILE * 0.36, Math.PI, 0);
      ctx.lineTo(TILE * 0.36, TILE * 0.28);
      for (let i = 0; i < 3; i++) {
        const x1 = TILE * 0.36 - i * TILE * 0.24;
        ctx.lineTo(x1 - TILE * 0.12, TILE * 0.16);
        ctx.lineTo(x1 - TILE * 0.24, TILE * 0.28);
      }
      ctx.lineTo(-TILE * 0.36, -4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-7, -6, 5, 0, Math.PI * 2);
      ctx.arc(7, -6, 5, 0, Math.PI * 2);
      ctx.fill();

      const eyeDx = frightened ? 0 : g.dir.x * 2;
      const eyeDy = frightened ? 1 : g.dir.y * 2;
      ctx.fillStyle = "#15233d";
      ctx.beginPath();
      ctx.arc(-7 + eyeDx, -6 + eyeDy, 2.2, 0, Math.PI * 2);
      ctx.arc(7 + eyeDx, -6 + eyeDy, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function draw() {
      drawMaze();
      ghosts.forEach(drawGhost);
      drawPac();

      if (gameState === "paused") {
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffd84d";
        ctx.font = "bold 38px Arial";
        ctx.textAlign = "center";
        ctx.fillText("TẠM DỪNG", canvas.width / 2, canvas.height / 2);
      }
    }

    function loop(now: number) {
      if (gameState !== "playing") {
        draw();
        return;
      }

      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      updatePac(dt);
      updateGhosts(dt);
      checkCollisions();
      draw();

      if (gameState === "playing") rafId = requestAnimationFrame(loop);
    }

    function setDirection(name: string) {
      if (!(name in DIRS)) return;
      const dir = DIRS[name as DirName];
      pac.want = dir;

      if (pac.dir.name === reverseDir(dir).name) {
        pac.dir = dir;
      }
    }

    function togglePause() {
      if (gameState === "playing") {
        gameState = "paused";
        draw();
      } else if (gameState === "paused") {
        gameState = "playing";
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    }

    function handleKeydown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const mapKey: Record<string, DirName> = {
        arrowleft: "left",
        a: "left",
        arrowright: "right",
        d: "right",
        arrowup: "up",
        w: "up",
        arrowdown: "down",
        s: "down",
      };

      if (key === " " || key === "spacebar") {
        e.preventDefault();
        if (e.repeat) return;
        if (
          gameState === "start" ||
          gameState === "ready" ||
          gameState === "gameover"
        ) {
          overlayEl.querySelector<HTMLButtonElement>(`.${styles.btn}`)?.click();
        } else {
          togglePause();
        }
        return;
      }

      if (mapKey[key]) {
        e.preventDefault();
        if (gameState === "playing") setDirection(mapKey[key]);
      }
    }

    function handleControlClick(e: Event) {
      const btn = e.currentTarget as HTMLButtonElement;
      const dir = btn.dataset.dir;
      if (!dir) return;
      if (dir === "pause") {
        if (
          gameState === "start" ||
          gameState === "ready" ||
          gameState === "gameover"
        ) {
          overlayEl.querySelector<HTMLButtonElement>(`.${styles.btn}`)?.click();
        } else {
          togglePause();
        }
        return;
      }
      if (gameState === "playing") setDirection(dir);
    }

    let touchStart: { x: number; y: number } | null = null;
    function handleTouchStart(e: TouchEvent) {
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    }
    function handleTouchEnd(e: TouchEvent) {
      if (!touchStart || gameState !== "playing") return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if (Math.hypot(dx, dy) < 24) return;

      if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? "right" : "left");
      else setDirection(dy > 0 ? "down" : "up");
      touchStart = null;
    }

    window.addEventListener("keydown", handleKeydown, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    startBtnEl.addEventListener("click", newGame);

    const controlButtons = Array.from(
      wrapEl.querySelectorAll<HTMLButtonElement>("[data-dir]"),
    );
    controlButtons.forEach((btn) =>
      btn.addEventListener("click", handleControlClick),
    );

    // Vẽ màn hình ban đầu.
    score = 0;
    lives = 3;
    level = 1;
    gameState = "start";
    resetLevel(true);
    draw();

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      startBtnEl.removeEventListener("click", newGame);
      controlButtons.forEach((btn) =>
        btn.removeEventListener("click", handleControlClick),
      );
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <section className={styles.topbar}>
        <div className={styles.title}>DOT MUNCHER</div>
        <div className={styles.stats}>
          <span>
            Điểm: <b ref={scoreRef}>0</b>
          </span>
          <span>
            Mạng: <b ref={livesRef}>3</b>
          </span>
          <span>
            Màn: <b ref={levelRef}>1</b>
          </span>
        </div>
      </section>

      <section className={styles.stage} aria-label="Khu vực chơi game">
        <canvas ref={canvasRef} className={styles.canvas} />
        <div ref={overlayRef} className={styles.overlay}>
          <div className={styles.card}>
            <h1>Dot Muncher</h1>
            <p>
              Ăn hết chấm trong mê cung, tránh các bóng ma. Ăn viên lớn để tạm
              thời phản công.
            </p>
            <p>
              Điều khiển: <span className={styles.kbd}>←</span>{" "}
              <span className={styles.kbd}>↑</span>{" "}
              <span className={styles.kbd}>→</span>{" "}
              <span className={styles.kbd}>↓</span> hoặc{" "}
              <span className={styles.kbd}>WASD</span>.
            </p>
            <p>
              Bấm <span className={styles.kbd}>Space</span> để tạm dừng / chơi
              tiếp.
            </p>
            <button ref={startBtnRef} className={styles.btn}>
              Bắt đầu chơi
            </button>
          </div>
        </div>
      </section>

      <section className={styles.controls} aria-label="Nút điều khiển cảm ứng">
        <button className={`${styles.controlBtn} ${styles.empty}`}>.</button>
        <button className={styles.controlBtn} data-dir="up">
          ▲
        </button>
        <button className={`${styles.controlBtn} ${styles.empty}`}>.</button>
        <button className={styles.controlBtn} data-dir="left">
          ◀
        </button>
        <button className={styles.controlBtn} data-dir="pause">
          ●
        </button>
        <button className={styles.controlBtn} data-dir="right">
          ▶
        </button>
        <button className={`${styles.controlBtn} ${styles.empty}`}>.</button>
        <button className={styles.controlBtn} data-dir="down">
          ▼
        </button>
        <button className={`${styles.controlBtn} ${styles.empty}`}>.</button>
      </section>

      <p className={styles.hint}>
        Điều khiển bằng phím mũi tên hoặc WASD. Trên di động, dùng nút điều
        khiển bên dưới màn chơi.
      </p>
    </div>
  );
}
