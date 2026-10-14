Object.assign(Config, {'redo_ind':true, 'grey_ind':false, 'rotate180_ind':true})

// inputs used on the current piece, the turn it belongs to, and the finesse stats of the session
var Finesse = {
    inputs: [],
    pressed: {},
    turn: null,
    target: null,
    target_piece: '',
    target_key: '',
    wrong_spot: '',
    last_fault: false,
    placed: 0,
    checked: 0,
    faults: 0,
    lines: 0,
}

/*
1. html related
*/

function load_gamemode(){
    try{
        Config.redo_ind = localStorage.getItem('finesse_redo_ind') != 'false'
        Config.grey_ind = localStorage.getItem('finesse_grey_ind') == 'true'
        Config.rotate180_ind = localStorage.getItem('finesse_rotate180_ind') != 'false'
    }
    catch(err){
        console.log('storage unavailable')
    }
    document.getElementById('redo_ind').checked = Config.redo_ind
    document.getElementById('grey_ind').checked = Config.grey_ind
    document.getElementById('rotate180_ind').checked = Config.rotate180_ind
}

function save_gamemode(){
    Config.redo_ind = document.getElementById('redo_ind').checked
    Config.grey_ind = document.getElementById('grey_ind').checked
    Config.rotate180_ind = document.getElementById('rotate180_ind').checked
    try{
        localStorage.setItem('finesse_redo_ind', Config.redo_ind)
        localStorage.setItem('finesse_grey_ind', Config.grey_ind)
        localStorage.setItem('finesse_rotate180_ind', Config.rotate180_ind)
    }
    catch(err){
        console.log('storage unavailable')
    }
    if (!Config.redo_ind){
        Finesse.target = null
        Finesse.wrong_spot = ''
    }
}

function set_gamemode_listener(){
    document.getElementById('redo_ind').onchange = e=>{save_gamemode()}
    document.getElementById('grey_ind').onchange = e=>{save_gamemode()}
    document.getElementById('rotate180_ind').onchange = e=>{save_gamemode()}
}

function update_stats(){
    document.getElementById('stat_pieces').textContent = Finesse.placed
    document.getElementById('stat_faults').textContent = Finesse.faults
    document.getElementById('stat_accuracy').textContent = Finesse.checked == 0 ? '-' :
        ((Finesse.checked - Finesse.faults) / Finesse.checked * 100).toFixed(1) + '%'
    document.getElementById('stat_lines').textContent = Finesse.lines
}

/*
2. render
*/

// outline where the redone piece was placed
function render_overlay(ctx, offset_x, offset_y){
    if (Finesse.target != null){
        ctx.strokeStyle = color_table[Finesse.target_piece]
        ctx.lineWidth = 3
        for (var [col, row] of Finesse.target)
            ctx.strokeRect(col*30+offset_x+2,(19-row)*30+offset_y+2,26,26);
        ctx.lineWidth = 1
    }
}

function render_stats(ctx){
    if (Finesse.last_fault){
        ctx.fillStyle = 'rgb(235, 79, 101)';
        ctx.fillText('Finesse',10,400)
        ctx.fillText('error!',10,425)
    }
    if (Finesse.wrong_spot != ''){
        ctx.fillStyle = 'rgb(235, 79, 101)';
        ctx.fillText('Wrong',10,470)
        ctx.fillText(Finesse.wrong_spot + '!',10,495)
    }

    ctx.fillStyle = 'green';
    ctx.fillText('Errors:',420,450)
    ctx.fillText(Finesse.faults+'/'+Finesse.checked,420,470)
}

/*
3. finesse
*/
const finesse_moves = [
    {name: 'Left', move: g => g.move_left()},
    {name: 'Right', move: g => g.move_right()},
    {name: 'DAS Left', move: g => g.move_leftmost()},
    {name: 'DAS Right', move: g => g.move_rightmost()},
    {name: 'CW', move: g => g.rotate_clockwise()},
    {name: 'CCW', move: g => g.rotate_anticlockwise()},
    {name: '180', move: g => g.rotate_180()},
    {name: 'Soft Drop', move: g => g.softdrop()},
]

function cells_key(cells){
    return cells.map(cell => cell.join()).sort().join(' ')
}

// the cells a piece lands on if hard dropped now, and for T whether it counts as a T-spin
function landing_key(g){
    var previous_y = g.y
    var previous_lastmove = g.lastmove
    g.drop()
    var key = cells_key(g.to_shape())
    if (g.tetramino == 'T') key += ' ' + g.is_tspin()
    g.y = previous_y
    g.lastmove = previous_lastmove
    return key
}

// the part of the last move that is_tspin looks at
function spin_class(lastmove){
    if (lastmove == 'zkick4') return 'kick4'
    return 'axz'.includes(lastmove[0])? 'rotate': ''
}

// fewest inputs from spawn to every landing spot on the current board,
// where holding DAS counts as one input and soft drop is instant and counts as one input
function get_finesse_table(tetramino){
    var sim = new Game()
    sim.board = game.board
    sim.bag = [tetramino]
    sim.update()
    var state_key = g => [g.x, g.y, g.orientation, tetramino == 'T'? spin_class(g.lastmove): ''].join()
    var save_state = (g, path) => ({x: g.x, y: g.y, orientation: g.orientation, lastmove: g.lastmove, path: path})
    var load_state = (g, state) => {
        g.x = state.x
        g.y = state.y
        g.orientation = state.orientation
        g.lastmove = state.lastmove
    }
    var table = {}
    if (sim.is_collide()) return table
    var seen = {}
    seen[state_key(sim)] = true
    var queue = [save_state(sim, [])]
    for (var i=0; i<queue.length; i++){
        var state = queue[i]
        load_state(sim, state)
        var key = landing_key(sim)
        if (!(key in table)) table[key] = state.path
        for (var finesse_move of finesse_moves){
            if (finesse_move.name == '180' && !Config.rotate180_ind) continue
            load_state(sim, state)
            finesse_move.move(sim)
            if (seen[state_key(sim)]) continue
            seen[state_key(sim)] = true
            queue.push(save_state(sim, state.path.concat(finesse_move.name)))
        }
    }
    return table
}

function record_input(name){
    var input = {name: name}
    Finesse.inputs.push(input)
    return input
}

// inputs reported by the shared controls: a key that starts repeating makes its input a DAS, and a held soft drop
// that keeps moving the piece is still the same input, but a key still held from the previous piece is a new input for this one
function on_input(name, held = false){
    var key = name.replace('DAS ', '')
    var input = Finesse.pressed[key]
    if ((key != name || held) && Finesse.inputs.includes(input)){
        input.name = name
        return
    }
    Finesse.pressed[key] = record_input(name)
}

// every input from spawn to hard drop counts, including moves on a piece that was then held,
// and the turn remembers its starting state so redo can bring back the same piece and hold
function start_turn(){
    Finesse.turn = {piece: game.tetramino, bag: game.bag.slice(), holdmino: game.holdmino}
    Finesse.inputs = []
}

function describe_inputs(names){
    if (names.length == 0) return 'Hard drop only (0 inputs)'
    return names.join(', ') + ' (' + names.length + (names.length == 1? ' input)': ' inputs)')
}

// returns whether the current piece would be placed with more inputs or holds than needed
function check_finesse(){
    var optimal = get_finesse_table(game.tetramino)[landing_key(game)]
    if (optimal === undefined) return false
    Finesse.checked += 1
    var used = Finesse.inputs.map(input => input.name)
    var needed_holds = game.tetramino == Finesse.turn.piece? 0: 1
    if (needed_holds) optimal = ['Hold'].concat(optimal)
    var holds = used.filter(name => name == 'Hold').length
    Finesse.last_fault = used.length > optimal.length || holds > needed_holds
    if (Finesse.last_fault){
        Finesse.faults += 1
        document.getElementById('finesse_piece').textContent = game.tetramino + ' piece'
        document.getElementById('finesse_used').textContent = 'You: ' + describe_inputs(used)
        document.getElementById('finesse_optimal').textContent = 'Optimal: ' + describe_inputs(optimal)
    }
    return Finesse.last_fault
}

function landing_cells(){
    var previous_y = game.y
    game.drop()
    var cells = game.to_shape()
    game.y = previous_y
    return cells
}

// recolor a placed piece grey, following the rows that were cleared under it
function grey_out(cells, full_rows){
    for (var [col, row] of cells){
        if (full_rows.includes(row)) continue
        game.board[row - full_rows.filter(full_row => full_row < row).length][col] = 'G'
    }
}

// bring back the piece and hold from the start of the turn
function redo_turn(){
    game.bag = Finesse.turn.bag.slice()
    game.holdmino = Finesse.turn.holdmino
    game.update()
    start_turn()
}

function hard_drop(){
    // a redone piece can only be placed in the spot it had the finesse error in
    if (Finesse.target != null && landing_key(game) != Finesse.target_key){
        Finesse.wrong_spot = cells_key(landing_cells()) == cells_key(Finesse.target)? 'spin': 'spot'
        redo_turn()
        return
    }
    Finesse.wrong_spot = ''
    var fault = check_finesse()
    if (fault) sound.lose.cloneNode().play()
    if (fault && Config.redo_ind){
        Finesse.target = landing_cells()
        Finesse.target_piece = game.tetramino
        Finesse.target_key = landing_key(game)
        redo_turn()
        update_stats()
        return
    }

    var current = game
    var cells = landing_cells()
    var full_rows = []
    for (var row=0; row<20; row++)
        if (game.board[row].every((cell, col) => cell != 'N' || cells.some(([c, r]) => c == col && r == row)))
            full_rows.push(row)
    game.harddrop()
    Finesse.placed += 1
    Finesse.lines += current.line_clear
    if (game === current && fault && Config.grey_ind) grey_out(cells, full_rows)
    Finesse.target = null
    start_turn()
    if (!fault) play_sound()
    update_stats()
}

// called by Game on top out: start a new board but keep the stats
function retry(){
    game = new Game()
    Finesse.target = null
    Finesse.wrong_spot = ''
    start_turn()
    render()
}

// the Retry key also resets the stats
function restart(){
    Finesse.placed = 0
    Finesse.checked = 0
    Finesse.faults = 0
    Finesse.lines = 0
    Finesse.last_fault = false
    document.getElementById('finesse_piece').textContent = 'No errors yet'
    document.getElementById('finesse_used').textContent = ''
    document.getElementById('finesse_optimal').textContent = ''
    update_stats()
    retry()
}

/*
4. start
*/
set_event_listener()
set_gamemode_listener()
load_setting()
load_gamemode()
update_keybind()
start_turn()
update_stats()
board.focus()
render()
