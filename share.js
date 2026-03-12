// ── AverageHuman share card generator ────────────────────────────────────────
// Reads all result data from the DOM and renders a branded PNG card.

const _C = {
  bg:      '#0d0d0d',
  cardBg:  '#161616',
  border:  '#222222',
  text:    '#ffffff',
  dim:     '#777777',
  primary: '#00e887',
};

function shareScore() {
  const testName = document.title.replace(/ [—–-] AverageHuman.*$/, '').trim();
  const el = document.getElementById('screen-result');

  // Stat cards (quantity, time, visual-memory, sequence-memory, ball-tracking,
  //             multitasking, go-nogo)
  const cards = [...el.querySelectorAll('.stat-card')].map(card => {
    const valueEl = card.querySelector('.value');
    return {
      label: (card.querySelector('.label')?.textContent || '').trim(),
      value: (valueEl?.textContent || '—').trim(),
      color: valueEl ? getComputedStyle(valueEl).color : _C.primary,
    };
  });

  // Board table (math, tapping, stroop, mental-rotation)
  const boardHeaders = [...el.querySelectorAll('.board-header span')]
    .map(s => s.textContent.trim());
  const boardRows = [...el.querySelectorAll('.board-row')].map(row =>
    [...row.querySelectorAll('.bc')].map(cell => ({
      text:  cell.textContent.trim(),
      color: getComputedStyle(cell).color,
    }))
  );

  // Best-line summary text — innerText respects <br> line breaks
  const bestRaw = (el.querySelector('.best-line')?.innerText || '').trim();
  const bestLine = bestRaw.replace(/\n+/g, ' · ');

  _buildCanvas(testName, cards, boardHeaders, boardRows, bestLine);
}

// ── Canvas renderer ──────────────────────────────────────────────────────────

function _buildCanvas(testName, cards, boardHeaders, boardRows, bestLine) {
  const W       = 1200;
  const PAD     = 64;
  const HEADER  = 116;   // logo + test name + separator
  const FOOTER  = 64;
  const CGAP    = 16;    // card gap
  const CH      = 112;   // card height
  const ROW_H   = 44;
  const BHDR_H  = 44;    // board header row height

  const hasCards = cards.length > 0;
  const hasBoard = boardRows.length > 0;

  // Card grid sizing
  const cardCols = Math.min(cards.length, 4);
  const cardRows = hasCards ? Math.ceil(cards.length / cardCols) : 0;
  const cardW    = hasCards
    ? Math.floor((W - 2 * PAD - (cardCols - 1) * CGAP) / cardCols)
    : 0;
  const cardsBlockH = hasCards ? cardRows * CH + (cardRows - 1) * CGAP : 0;

  // Board sizing
  const boardH = hasBoard ? BHDR_H + boardRows.length * ROW_H : 0;

  const bestH = bestLine ? 32 : 0;

  const H = HEADER
    + (hasCards ? PAD / 2 + cardsBlockH : 0)
    + (hasBoard ? PAD / 2 + boardH      : 0)
    + (bestH    ? PAD / 2 + bestH       : 0)
    + FOOTER;

  const cv  = document.createElement('canvas');
  cv.width  = W;
  cv.height = Math.max(H, 380);
  const ctx = cv.getContext('2d');

  // ── Background & grid ──────────────────────────────────────────────────────
  ctx.fillStyle = _C.bg;
  ctx.fillRect(0, 0, W, cv.height);

  ctx.strokeStyle = 'rgba(0,232,135,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke();
  }
  for (let y = 0; y <= cv.height; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Logo ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = _C.primary;
  ctx.fillRect(PAD, 44, 28, 3);

  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.font         = "700 18px 'Manrope', Arial, sans-serif";
  ctx.fillStyle    = _C.text;
  ctx.fillText('Average', PAD + 38, 56);
  const avgW = ctx.measureText('Average').width;
  ctx.fillStyle = _C.primary;
  ctx.fillText('Human', PAD + 38 + avgW, 56);

  // ── Test name ──────────────────────────────────────────────────────────────
  ctx.font      = "600 20px 'Manrope', Arial, sans-serif";
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.textAlign = 'center';
  ctx.fillText(testName.toUpperCase(), W / 2, 88);

  // Separator
  ctx.strokeStyle = _C.border;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, HEADER);
  ctx.lineTo(W - PAD, HEADER);
  ctx.stroke();

  let curY = HEADER + PAD / 2;

  // ── Stat cards ─────────────────────────────────────────────────────────────
  if (hasCards) {
    for (let i = 0; i < cards.length; i++) {
      const col = i % cardCols;
      const row = Math.floor(i / cardCols);
      const cx  = PAD + col * (cardW + CGAP);
      const cy  = curY + row * (CH + CGAP);

      // Card background
      _rrect(ctx, cx, cy, cardW, CH, 10);
      ctx.fillStyle   = _C.cardBg;
      ctx.fill();
      ctx.strokeStyle = _C.border;
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Label
      ctx.font         = "600 12px 'Manrope', Arial, sans-serif";
      ctx.fillStyle    = _C.dim;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(cards[i].label.toUpperCase(), cx + cardW / 2, cy + 16);

      // Value — shrink font if long
      const vLen    = cards[i].value.replace(/\s/g, '').length;
      const vSize   = vLen > 7 ? 24 : vLen > 5 ? 28 : 34;
      ctx.font         = `700 ${vSize}px 'Space Mono', 'Courier New', monospace`;
      ctx.fillStyle    = cards[i].color;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cards[i].value, cx + cardW / 2, cy + CH / 2 + 10);
    }
    curY += cardsBlockH + PAD / 2;
  }

  // ── Best line ──────────────────────────────────────────────────────────────
  if (bestLine) {
    ctx.font         = "400 15px 'Manrope', Arial, sans-serif";
    ctx.fillStyle    = _C.dim;
    ctx.textAlign    = hasBoard ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bestLine, hasBoard ? PAD : W / 2, curY + bestH / 2);
    curY += bestH + PAD / 2;
  }

  // ── Board ──────────────────────────────────────────────────────────────────
  if (hasBoard) {
    const bx   = PAD;
    const bw   = W - 2 * PAD;
    const cols = boardHeaders.length || (boardRows[0]?.length || 1);
    const colW = bw / cols;

    // Board outer box
    _rrect(ctx, bx, curY, bw, boardH, 10);
    ctx.fillStyle   = _C.cardBg;
    ctx.fill();
    ctx.strokeStyle = _C.border;
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Header row background
    _rrectTop(ctx, bx, curY, bw, BHDR_H, 10);
    ctx.fillStyle = '#1c1c1c';
    ctx.fill();

    // Header labels
    boardHeaders.forEach((h, i) => {
      ctx.font         = "600 12px 'Space Mono', 'Courier New', monospace";
      ctx.fillStyle    = _C.dim;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(h.toUpperCase(), bx + i * colW + 20, curY + BHDR_H / 2);
    });

    // Data rows
    boardRows.forEach((row, ri) => {
      const ry = curY + BHDR_H + ri * ROW_H;

      // Alternating tint
      if (ri % 2 === 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(bx + 1, ry, bw - 2, ROW_H);
      }

      // Row separator
      ctx.strokeStyle = _C.border;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 1, ry);
      ctx.lineTo(bx + bw - 1, ry);
      ctx.stroke();

      // Cells
      row.forEach((cell, ci) => {
        ctx.font         = "400 14px 'Space Mono', 'Courier New', monospace";
        ctx.fillStyle    = cell.color;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.text, bx + ci * colW + 20, ry + ROW_H / 2);
      });
    });

    curY += boardH + PAD / 2;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  ctx.font         = "400 13px 'Manrope', Arial, sans-serif";
  ctx.fillStyle    = 'rgba(119,119,119,0.5)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('averagehuman.com', W / 2, cv.height - 28);

  // Outer border
  ctx.strokeStyle = 'rgba(0,232,135,0.12)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, cv.height - 1);

  _dlCard(cv);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function _rrectTop(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function _dlCard(canvas) {
  const a = document.createElement('a');
  a.download = 'averagehuman-score.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}
