/** Standard half breadboard layout: 30 rows (1–30), columns a–j, power rails. */

const COLS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
const ROWS = 30;
const HOLE_R = 5;
const ORIGIN_X = 50;
const ORIGIN_Y = 70;
const COL_SPACING = 28;
const ROW_SPACING = 8;
const RAIL_Y_TOP = [38, 48];
const RAIL_Y_BOT = [292, 302];

const holes = new Map();
const wires = [];
let tool = "wire";
let wireStart = null;
let previewLine = null;

const svg = document.getElementById("board");
const holesLayer = document.getElementById("holes");
const wiresLayer = document.getElementById("wires");
const previewLayer = document.getElementById("preview");
const statusEl = document.getElementById("status-text");

function holeId(row, col, rail) {
  if (rail) return `rail-${rail}-${row}`;
  return `${row}-${col}`;
}

function posFor(row, col, rail) {
  if (rail === "pos" || rail === "neg") {
    const idx = row < 2 ? 0 : 1;
    const y = row < 2 ? RAIL_Y_TOP[idx] : RAIL_Y_BOT[idx];
    const x = ORIGIN_X + (col === "left" ? 0 : 850) + (rail === "pos" ? 0 : 14);
    return { x, y };
  }
  const colIdx = COLS.indexOf(col);
  const sideOffset = colIdx < 5 ? 0 : 60;
  const x = ORIGIN_X + colIdx * COL_SPACING + sideOffset;
  const y = ORIGIN_Y + (row - 1) * ROW_SPACING;
  return { x, y };
}

function buildBoard() {
  const rails = document.getElementById("rails");

  ["+", "−", "+", "−"].forEach((label, i) => {
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("class", "rail-label");
    t.setAttribute("x", i < 2 ? 18 : 888);
    t.setAttribute("y", i % 2 === 0 ? 42 : 52);
    t.textContent = label;
    rails.appendChild(t);
  });

  for (let row = 1; row <= ROWS; row++) {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "row-label");
    label.setAttribute("x", 22);
    label.setAttribute("y", ORIGIN_Y + (row - 1) * ROW_SPACING + 4);
    label.textContent = String(row);
    rails.appendChild(label);
  }

  [["pos", "left"], ["neg", "left"], ["pos", "right"], ["neg", "right"]].forEach(
    ([rail, side], i) => {
      const rowKey = i;
      const { x, y } = posFor(rowKey, side, rail);
      addHole(holeId(rowKey, side, rail), x, y, { row: rowKey, col: side, rail });
    }
  );

  for (let row = 1; row <= ROWS; row++) {
    for (const col of COLS) {
      const { x, y } = posFor(row, col);
      addHole(holeId(row, col), x, y, { row, col });
    }
  }
}

function addHole(id, x, y, meta) {
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("class", "hole");
  if (meta.rail === "pos") c.classList.add("rail-pos");
  if (meta.rail === "neg") c.classList.add("rail-neg");
  c.setAttribute("cx", x);
  c.setAttribute("cy", y);
  c.setAttribute("r", HOLE_R);
  c.dataset.id = id;
  c.addEventListener("click", (e) => onHoleClick(id, e));
  holesLayer.appendChild(c);
  holes.set(id, { el: c, x, y, ...meta });
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function clearSelection() {
  wireStart = null;
  document.querySelectorAll(".hole.selected").forEach((el) => el.classList.remove("selected"));
  if (previewLine) {
    previewLine.remove();
    previewLine = null;
  }
}

function onHoleClick(id) {
  const hole = holes.get(id);
  if (!hole) return;

  if (tool === "erase") {
    removeWiresOnHole(id);
    setStatus(`Removed wires on ${id}.`);
    return;
  }

  if (!wireStart) {
    wireStart = id;
    hole.el.classList.add("selected");
    setStatus(`Start: ${id}. Click another hole.`);
    return;
  }

  if (wireStart === id) {
    clearSelection();
    setStatus("Cancelled.");
    return;
  }

  addWire(wireStart, id);
  clearSelection();
  setStatus(`Wire: ${wireStart} → ${id}`);
}

function addWire(fromId, toId) {
  const a = holes.get(fromId);
  const b = holes.get(toId);
  if (!a || !b) return;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "wire");
  path.setAttribute("d", wirePath(a.x, a.y, b.x, b.y));
  path.dataset.from = fromId;
  path.dataset.to = toId;
  path.addEventListener("click", () => {
    path.remove();
    wires.splice(wires.indexOf(rec), 1);
    setStatus("Wire removed.");
  });
  wiresLayer.appendChild(path);
  const rec = { fromId, toId, el: path };
  wires.push(rec);
}

function wirePath(x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2 - 20;
  return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${midY} ${x2} ${y2}`;
}

function removeWiresOnHole(id) {
  for (let i = wires.length - 1; i >= 0; i--) {
    const w = wires[i];
    if (w.fromId === id || w.toId === id) {
      w.el.remove();
      wires.splice(i, 1);
    }
  }
}

svg.addEventListener("mousemove", (e) => {
  if (!wireStart) return;
  const start = holes.get(wireStart);
  if (!start) return;
  const pt = svgPoint(e);
  if (!previewLine) {
    previewLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    previewLine.setAttribute("class", "wire-preview");
    previewLayer.appendChild(previewLine);
  }
  previewLine.setAttribute("d", wirePath(start.x, start.y, pt.x, pt.y));
});

function svgPoint(evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearSelection();
    setStatus("Cancelled.");
  }
});

document.querySelectorAll(".tool").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    tool = btn.dataset.tool;
    clearSelection();
    setStatus(tool === "wire" ? "Pick a hole to start a wire." : "Click a hole to erase its wires.");
  });
});

document.getElementById("clear-wires").addEventListener("click", () => {
  wires.forEach((w) => w.el.remove());
  wires.length = 0;
  clearSelection();
  setStatus("All wires cleared.");
});

buildBoard();
