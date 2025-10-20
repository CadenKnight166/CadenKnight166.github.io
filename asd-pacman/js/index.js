/* global $, sessionStorage, getLevel */

$(document).ready(function () {
  ////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// INITIALIZATION ///////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  // HTML jQuery Objects
  var $board = $("#board");

  // Constant Variables
  var FPS = 5;
  var BOARD_WIDTH = $board.width();
  var BOARD_HEIGHT = $board.height();
  var SQUARE_SIZE = 20;

  // other game variables
  var pacmanTimer; // for starting/stopping the timer that draws new Pacman frames
  var ghostTimer; // for starting/stopping the timer that draws new ghost frames
  var pacman; // an Object to manage Pacman's $element and movement/location data
  var redGhost; // an Object to manage the redGhost's $element and movement/location data
  var level; // a 2D representation of the level with numbers representing walls, pellets, etc...
  var pelletsEaten; // the number of pellets eaten by Pacman
  var gameOver = false; // prevents multiple resets
  var score = 0;
  var lives = 3;
  var totalPellets = 0;
  var spawnPacman = null;
  var spawnGhost = null;

  // direction vectors (row, col)
  var DIRS = {
    left: { r: 0, c: -1 },
    right: { r: 0, c: 1 },
    up: { r: -1, c: 0 },
    down: { r: 1, c: 0 },
  };

  function startGame() {
    // set initial values for the global variables...
    pelletsEaten = 0;
    // allow reset to start again
    gameOver = false;
    score = 0;
    lives = 3;
    createMaze();
    initActors();
    createHUD();

    // start the timers to draw new frames
    var timeBetweenPacmanFrames = 1000 / FPS; // 5 frames per second
    var timeBetweenGhostFrames = 1000 / (FPS - 1); // 4 frames per second
    pacmanTimer = setInterval(drawNewPacmanFrame, timeBetweenPacmanFrames);
    ghostTimer = setInterval(drawNewGhostFrame, timeBetweenGhostFrames);

    // turn on event handlers (namespaced)
    $(document).on("keydown.pacman", handleEvent);
  }

  function endGame() {
    // stop the timers
    clearInterval(pacmanTimer);
    clearInterval(ghostTimer);

    // turn off event handlers
    $(document).off(".pacman");
  }

  ////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// CORE LOGIC ///////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  // start the game
  startGame();

  // createMaze: render squares and pellets based on level data
  function createMaze() {
    level = getLevel("level1");
    var rows = level.length;
    var cols = level[0].length;
    totalPellets = 0;
    // set board pixel size
    $board.css({
      width: cols * SQUARE_SIZE + "px",
      height: rows * SQUARE_SIZE + "px",
    });
    $board.empty();

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var val = level[r][c];
        var $sq = $("<div class='square'></div>");
        $sq.attr("id", "r" + r + "c" + c);
        $sq.css({ left: c * SQUARE_SIZE + "px", top: r * SQUARE_SIZE + "px" });
        if (val === 1) $sq.addClass("wall");
        if (val === 7) $sq.addClass("gate");
        if (val === 0) {
          var $pel = $("<div class='pellet'></div>");
          $sq.append($pel);
          totalPellets++;
        }
        $board.append($sq);
      }
    }
  }

  // initActors: create pacman and redGhost DOM elements and set positions
  function initActors() {
    // remove existing actors
    $("#pacman").remove();
    $("#redGhost").remove();

    var rows = level.length;
    var cols = level[0].length;
    var pPos = null,
      gPos = null;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (level[r][c] === 2) {
          pPos = { r: r, c: c };
          level[r][c] = 9;
          // record the spawn position
          spawnPacman = { r: r, c: c };
        }
        if (level[r][c] === 3) {
          gPos = { r: r, c: c };
          level[r][c] = 9;
          // record the spawn position
          spawnGhost = { r: r, c: c };
        }
      }
    }

    // if level no longer contains spawn tiles (subsequent calls), use recorded spawns
    if (!pPos) pPos = spawnPacman || { r: 1, c: 1 };
    if (!gPos) gPos = spawnGhost || { r: 1, c: cols - 2 };

    pacman = {
      r: pPos.r,
      c: pPos.c,
      dir: DIRS.left,
      $el: $("<img id='pacman' src='img/pacman.png'>"),
    };
    pacman.$el
      .css({
        left: pacman.c * SQUARE_SIZE + "px",
        top: pacman.r * SQUARE_SIZE + "px",
      })
      .appendTo($board);

    redGhost = {
      r: gPos.r,
      c: gPos.c,
      dir: DIRS.right,
      $el: $("<img id='redGhost' src='img/redGhost.png'>"),
    };
    redGhost.$el
      .css({
        left: redGhost.c * SQUARE_SIZE + "px",
        top: redGhost.r * SQUARE_SIZE + "px",
      })
      .appendTo($board);
  }

  /*
   * Called once per "tick" of the pacmanTimer. This function should execute the
   * high-level logic for drawing new frames of Pacman:
   *
   * - determine where pacman should move to
   * - if the next location is a wall:
   *   - don't move pacman
   * - otherwise:
   *   - move and redraw pacman
   * - if pacman is in the same location as a pellet:
   *   - "eat" the pellet by removing it from the DOM
   *   - increase the score
   * - if pacman is in the same location as a ghost:
   *   - end the game!
   */
  function drawNewPacmanFrame() {
    if (!pacman) return;
    var nextR = pacman.r + pacman.dir.r;
    var nextC = pacman.c + pacman.dir.c;
    // bounds
    if (
      nextR >= 0 &&
      nextR < level.length &&
      nextC >= 0 &&
      nextC < level[0].length
    ) {
      var val = level[nextR][nextC];
      if (val !== 1) {
        // not a wall
        pacman.r = nextR;
        pacman.c = nextC;
        pacman.$el.css({
          left: pacman.c * SQUARE_SIZE + "px",
          top: pacman.r * SQUARE_SIZE + "px",
        });
        // eat pellet if present
        var $sq = $("#r" + pacman.r + "c" + pacman.c);
        var $pel = $sq.find(".pellet");
        if ($pel.length) {
          $pel.remove();
          pelletsEaten++;
          score += 10;
          updateHUD();
          if (pelletsEaten >= totalPellets) {
            // win
            endGame();
            showOverlay("You Win!");
            setTimeout(function () {
              startGame();
            }, 1500);
            return;
          }
        }
      }
    }
    // check collision with ghost
    if (pacman.r === redGhost.r && pacman.c === redGhost.c) {
      resetGame();
    }
  }

  /*
   * Called once per "tick" of the ghostTimer which is slightly slower than
   * the pacmanTimer. This function should execute the high-level logic for
   * drawing new frames of the ghosts:
   *
   * - determine where the ghost should move to (it should never be a wall)
   * - move and redraw the ghost
   */
  function drawNewGhostFrame() {
    if (!redGhost) return;
    // Prefer BFS path to Pacman (shortest path). If none, fall back to heuristic.
    var path = getPathBFS(redGhost.r, redGhost.c, pacman.r, pacman.c);
    if (path && path.length >= 2) {
      // path[0] is current, path[1] is next step
      var next = path[1];
      redGhost.r = next.r;
      redGhost.c = next.c;
      redGhost.$el.css({
        left: redGhost.c * SQUARE_SIZE + "px",
        top: redGhost.r * SQUARE_SIZE + "px",
      });
    } else {
      // fallback: previous simple chase heuristic
      var dr = pacman.r - redGhost.r;
      var dc = pacman.c - redGhost.c;
      var tried = [];
      if (Math.abs(dc) >= Math.abs(dr)) {
        tried.push(dc < 0 ? DIRS.left : DIRS.right);
        tried.push(dr < 0 ? DIRS.up : DIRS.down);
      } else {
        tried.push(dr < 0 ? DIRS.up : DIRS.down);
        tried.push(dc < 0 ? DIRS.left : DIRS.right);
      }
      tried = tried.concat([DIRS.left, DIRS.right, DIRS.up, DIRS.down]);
      for (var i = 0; i < tried.length; i++) {
        var d = tried[i];
        var nr = redGhost.r + d.r;
        var nc = redGhost.c + d.c;
        if (nr < 0 || nr >= level.length || nc < 0 || nc >= level[0].length)
          continue;
        if (level[nr][nc] === 1) continue;
        redGhost.r = nr;
        redGhost.c = nc;
        redGhost.$el.css({
          left: redGhost.c * SQUARE_SIZE + "px",
          top: redGhost.r * SQUARE_SIZE + "px",
        });
        break;
      }
    }

    if (redGhost.r === pacman.r && redGhost.c === pacman.c) resetGame();
  }

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////// HELPER FUNCTIONS ////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  // display overlay on board
  function showOverlay(text) {
    $("#overlay").remove();
    var $ov = $("<div id='overlay'></div>");
    $ov.css({
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      color: "white",
      "font-size": "28px",
      background: "rgba(0,0,0,0.6)",
      "z-index": 2000,
    });
    $ov.text(text);
    $board.append($ov);
  }

  // Breadth-first search to find shortest path from (sr,sc) to (gr,gc)
  // returns array of {r,c} from start to goal inclusive, or null if unreachable
  function getPathBFS(sr, sc, gr, gc) {
    var rows = level.length;
    var cols = level[0].length;
    var visited = new Array(rows);
    for (var r = 0; r < rows; r++) {
      visited[r] = new Array(cols).fill(false);
    }
    var queue = [];
    // store parent pointers as a map keyed by r+','+c
    var parent = {};
    queue.push({ r: sr, c: sc });
    visited[sr][sc] = true;
    var found = false;
    var dirs = [DIRS.up, DIRS.left, DIRS.right, DIRS.down];
    while (queue.length > 0) {
      var cur = queue.shift();
      if (cur.r === gr && cur.c === gc) {
        found = true;
        break;
      }
      for (var i = 0; i < dirs.length; i++) {
        var d = dirs[i];
        var nr = cur.r + d.r;
        var nc = cur.c + d.c;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (visited[nr][nc]) continue;
        if (level[nr][nc] === 1) continue; // wall
        visited[nr][nc] = true;
        parent[nr + "," + nc] = cur.r + "," + cur.c;
        queue.push({ r: nr, c: nc });
      }
    }
    if (!found) return null;
    // reconstruct path
    var path = [];
    var key = gr + "," + gc;
    while (true) {
      var parts = key.split(",");
      path.push({ r: parseInt(parts[0], 10), c: parseInt(parts[1], 10) });
      if (key === sr + "," + sc) break;
      key = parent[key];
    }
    path.reverse();
    return path;
  }

  function removeOverlay() {
    $("#overlay").remove();
  }

  function resetGame() {
    if (gameOver) return;
    gameOver = true;
    endGame();
    // lose a life
    lives -= 1;
    updateHUD();
    if (lives <= 0) {
      showOverlay("Game Over");
      setTimeout(function () {
        removeOverlay();
        // restart full game
        startGame();
      }, 1500);
    } else {
      showOverlay("Life Lost");
      setTimeout(function () {
        removeOverlay();
        // restart current game state
        gameOver = false;
        // Do NOT regenerate the maze/pellets on life lost. Only reset actors.
        // Recount existing pellets on the board to set pelletsEaten correctly.
        pelletsEaten = totalPellets - $(".pellet").length;
        // re-create actors at their spawn positions
        initActors();
        createHUD();
        // restart timers
        var timeBetweenPacmanFrames = 1000 / FPS;
        var timeBetweenGhostFrames = 1000 / (FPS - 1);
        pacmanTimer = setInterval(drawNewPacmanFrame, timeBetweenPacmanFrames);
        ghostTimer = setInterval(drawNewGhostFrame, timeBetweenGhostFrames);
        // re-bind input handler so player can move again
        $(document).on("keydown.pacman", handleEvent);
      }, 1000);
    }
  }

  function createHUD() {
    $("#hud").remove();
    var $hud = $("<div id='hud'></div>");
    $hud.append(
      $(
        "<div class='item' id='score'>Score: <span class='val'>" +
          score +
          "</span></div>"
      )
    );
    $hud.append(
      $(
        "<div class='item' id='lives'>Lives: <span class='val'>" +
          lives +
          "</span></div>"
      )
    );
    // place HUD above the board so it doesn't overlap the game
    $board.before($hud);
    updateHUD();
  }

  function updateHUD() {
    $("#hud #score .val").text(score);
    $("#hud #lives .val").text(lives);
  }

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////// EVENT HELPER FUNCTIONS //////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  function handleEvent(event) {
    var key = event.which || event.keyCode;
    if (key === 37) pacman.dir = DIRS.left;
    else if (key === 38) pacman.dir = DIRS.up;
    else if (key === 39) pacman.dir = DIRS.right;
    else if (key === 40) pacman.dir = DIRS.down;
  }
});
