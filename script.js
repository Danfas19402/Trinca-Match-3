(() => {
  const SIZE = 8;
  const PIECES = ["🔴", "🟡", "🟢", "🔵", "🟣", "🟠"];
  let grid = [];
  let selected = null;
  let busy = false;
  let score = 0;
  let moves = 0;

  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const movesEl = document.getElementById("moves");
  const newGameBtn = document.getElementById("newGame");
  const shuffleBtn = document.getElementById("shuffle");

  const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  const idx = (r, c) => r * SIZE + c;

  function randomPiece(){
    return PIECES[Math.floor(Math.random() * PIECES.length)];
  }

  function createGrid(){
    grid = Array.from({length: SIZE}, () => Array(SIZE).fill(null));
    for (let r = 0; r < SIZE; r++){
      for (let c = 0; c < SIZE; c++){
        let piece;
        do {
          piece = randomPiece();
        } while (
          (c >= 2 && grid[r][c-1] === piece && grid[r][c-2] === piece) ||
          (r >= 2 && grid[r-1][c] === piece && grid[r-2][c] === piece)
        );
        grid[r][c] = piece;
      }
    }
  }

  function render(){
    boardEl.innerHTML = "";
    for (let r = 0; r < SIZE; r++){
      for (let c = 0; c < SIZE; c++){
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.textContent = grid[r][c];
        cell.addEventListener("click", onCellClick);
        boardEl.appendChild(cell);
      }
    }
  }

  function getCellEl(r, c){
    return boardEl.children[idx(r,c)];
  }

  function setSelected(r, c){
    if (selected) getCellEl(selected.r, selected.c).classList.remove("selected");
    selected = { r, c };
    getCellEl(r, c).classList.add("selected");
  }

  function clearSelection(){
    if (selected) getCellEl(selected.r, selected.c).classList.remove("selected");
    selected = null;
  }

  function areAdjacent(a, b){
    return (a.r === b.r && Math.abs(a.c - b.c) === 1) ||
           (a.c === b.c && Math.abs(a.r - b.r) === 1);
  }

  function swap(a, b){
    [grid[a.r][a.c], grid[b.r][b.c]] = [grid[b.r][b.c], grid[a.r][a.c]];
    getCellEl(a.r, a.c).textContent = grid[a.r][a.c];
    getCellEl(b.r, b.c).textContent = grid[b.r][b.c];
  }

  function findMatches(){
    const toClear = new Set();
    // Linhas
    for (let r = 0; r < SIZE; r++){
      let start = 0;
      for (let c = 1; c <= SIZE; c++){
        const same = c < SIZE && grid[r][c] === grid[r][start];
        if (!same){
          if (c - start >= 3){
            for (let k = start; k < c; k++) toClear.add(`${r},${k}`);
          }
          start = c;
        }
      }
    }
    // Colunas
    for (let c = 0; c < SIZE; c++){
      let start = 0;
      for (let r = 1; r <= SIZE; r++){
        const same = r < SIZE && grid[r][c] === grid[start][c];
        if (!same){
          if (r - start >= 3){
            for (let k = start; k < r; k++) toClear.add(`${k},${c}`);
          }
          start = r;
        }
      }
    }
    return toClear;
  }

  function clearMatches(cells){
    cells.forEach(key => {
      const [r, c] = key.split(",").map(Number);
      getCellEl(r,c).classList.add("clearing");
    });
    setTimeout(() => {
      cells.forEach(key => {
        const [r, c] = key.split(",").map(Number);
        grid[r][c] = null;
        getCellEl(r,c).textContent = "";
        getCellEl(r,c).classList.remove("clearing");
      });
      dropPieces();
    }, 200);
  }

  function dropPieces(){
    for (let c = 0; c < SIZE; c++){
      let write = SIZE - 1;
      for (let r = SIZE - 1; r >= 0; r--){
        if (grid[r][c] !== null){
          grid[write][c] = grid[r][c];
          write--;
        }
      }
      while (write >= 0){
        grid[write][c] = randomPiece();
        write--;
      }
    }
    render();
    const matches = findMatches();
    if (matches.size) clearMatches(matches);
    else busy = false;
  }

  function trySwap(a, b){
    busy = true;
    swap(a, b);
    const matches = findMatches();
    if (!matches.size){
      setTimeout(() => {
        swap(a, b);
        busy = false;
      }, 200);
    } else {
      moves++;
      updateHUD();
      clearMatches(matches);
    }
  }

  function onCellClick(e){
    if (busy) return;
    const r = +e.target.dataset.r;
    const c = +e.target.dataset.c;
    if (!selected) {
      setSelected(r, c);
    } else {
      const s = { ...selected };
      if (s.r === r && s.c === c) {
        clearSelection();
      } else if (areAdjacent(s, {r, c})) {
        clearSelection();
        trySwap(s, {r, c});
      } else {
        setSelected(r, c);
      }
    }
  }

  function updateHUD(){
    scoreEl.textContent = score;
    movesEl.textContent = moves;
  }

  function newGame(){
    score = 0;
    moves = 0;
    updateHUD();
    clearSelection();
    createGrid();
    render();
  }

  function shuffle(){
    if (busy) return;
    busy = true;
    const pieces = grid.flat();
    for (let i = pieces.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    grid = [];
    while (pieces.length) grid.push(pieces.splice(0, SIZE));
    render();
    busy = false;
  }

  newGameBtn.addEventListener("click", newGame);
  shuffleBtn.addEventListener("click", shuffle);

  newGame();
})();
