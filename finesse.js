var game = new Game();
const Keybind = {'keydown':{}, 'keyup':{}}
var Config = {'das':100, 'arr':0, 'delay':0, 'pressing_left':false, 'pressing_right': false, 'pressing_down': false, 'pressing':{},
'redo_ind':true, 'grey_ind':false, 'rotate180_ind':true}
var Customized_key = ['KeyJ','KeyL','KeyK','Space','KeyS','KeyD','KeyA','KeyF','KeyR','KeyP']
var board = document.getElementById('board')

// inputs used on the current piece, the turn it belongs to, and the finesse stats of the session
var Finesse = {
    inputs: [],
    left_input: null,
    right_input: null,
    down_input: null,
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
0. sound effect
*/
const sound={
    0:new Audio ("sound/1.ogg"),
    1:new Audio ("sound/2.ogg"),
    2:new Audio ("sound/3.ogg"),
    3:new Audio ("sound/4.ogg"),
    4:new Audio ("sound/5.ogg"),
    5:new Audio ("sound/6.ogg"),
    6:new Audio ("sound/7.ogg"),
    win:new Audio ("sound/win.ogg"),
    lose:new Audio ("sound/lose.ogg")
}

function play_sound(){
    if (game.combo >= 0){
        sound[Math.min(6,game.combo)].cloneNode().play()
    }
}

/*
1. html related
*/

function load_setting(){
    try{
        var storage = localStorage.getItem('Customized_key')
        if (storage!= null){
            Customized_key = JSON.parse(storage);
            Config.das = parseInt(localStorage.getItem('das'))
            if (! (Config.das>=1 && Config.das<=200)){
                Config.das = 100}
            Config.arr = parseInt(localStorage.getItem('arr'))
            if (! (Config.arr>=0 && Config.arr<=100)){
                Config.arr = 0
            }
        }
        Config.redo_ind = localStorage.getItem('finesse_redo_ind') != 'false'
        Config.grey_ind = localStorage.getItem('finesse_grey_ind') == 'true'
        Config.rotate180_ind = localStorage.getItem('finesse_rotate180_ind') != 'false'
    }
    catch(err){
        console.log('storage corrupted')
    }
    for (var i=0; i<10; i++){
        document.getElementById('input'+(i+1)).value = Customized_key[i]
    }
    document.getElementById('input11').value = Config.das
    document.getElementById('input12').value = Config.arr
}

function load_gamemode(){
    document.getElementById('redo_ind').checked = Config.redo_ind
    document.getElementById('grey_ind').checked = Config.grey_ind
    document.getElementById('rotate180_ind').checked = Config.rotate180_ind
}

function save_setting(){
    for (var i=0; i<10; i++){
        Customized_key[i] = document.getElementById('input'+(i+1)).value
    }
    Config.das = parseInt(document.getElementById('input11').value)
    if (! (Config.das>=1 && Config.das<=200)){
        alert('DAS should be between 1 to 200')
        Config.das = 100
    }
    Config.arr = parseInt(document.getElementById('input12').value)
    if (! (Config.arr>=0 && Config.arr<=100)){
        alert('ARR should be between 0 to 100')
        Config.arr = 0
    }
    update_keybind()
    localStorage.setItem('Customized_key',JSON.stringify(Customized_key))
    localStorage.setItem('das',Config.das)
    localStorage.setItem('arr',Config.arr)
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
function render(){
    var ctx = document.getElementById("board").getContext('2d');
    ctx.clearRect(0,0,520,610);
    // render background and margin

    var offset_x = 110
    var offset_y = 5
    ctx.fillStyle = 'black';
    ctx.fillRect(offset_x,offset_y,300,600);
    ctx.strokeStyle = 'grey';
    ctx.strokeRect(offset_x,offset_y,300,600);
    // render grid
    for (var row=0; row<20; row++)
    for (var col=0; col<10; col++){
        ctx.strokeRect(col*30+offset_x,(19-row)*30+offset_y,30,30);
    }

    // render shodow
    var min_relative_height = 20
    for (var [col, row] of game.to_shape()){
        var ground_height = 0
        for (var i=0; i<row; i++)
            if (game.board[i][col] != 'N')
                ground_height = i+1
        min_relative_height = Math.min(min_relative_height, row - ground_height)
    }
    ctx.fillStyle = 'grey';
    for (var [col, row] of game.to_shape())
        ctx.fillRect(col*30+offset_x,(19-row+min_relative_height)*30+offset_y,30,30);
    // render where the redone piece was placed
    if (Finesse.target != null){
        ctx.strokeStyle = color_table[Finesse.target_piece]
        ctx.lineWidth = 3
        for (var [col, row] of Finesse.target)
            ctx.strokeRect(col*30+offset_x+2,(19-row)*30+offset_y+2,26,26);
        ctx.lineWidth = 1
    }
    // render piece
    ctx.fillStyle = color_table[game.tetramino]
    for (var [col,row] of game.to_shape()){
        ctx.fillRect(col*30+offset_x,(19-row)*30+offset_y,30,30)
    }
    // render board
    ctx.strokeStyle = 'grey';
    for (var row=0; row<20; row++)
        for (var col=0; col<10; col++){
            if (game.board[row][col] != 'N'){
                ctx.fillStyle = color_table[game.board[row][col]];
                ctx.fillRect(col*30+offset_x,(19-row)*30+offset_y,30,30);
            }
        }


    // render hold
    var offset_x = 5
    var offset_y = 5
    ctx.fillStyle = 'black';
    ctx.fillRect(offset_x,offset_y,100,100);
    ctx.strokeStyle = 'grey';
    ctx.strokeRect(offset_x,offset_y,100,100);
    if (game.holdmino != ''){
        ctx.fillStyle = color_table[game.holdmino]
        for (var [col, row] of game.to_shape(game.holdmino)){
            var piece_offset = 'IO'.includes(game.holdmino)? 10: 20;
            ctx.fillRect((col+1)*20+offset_x+piece_offset,(3-row)*20+offset_y,20,20);
        }

    }
    // render next
    var offset_x = 415
    var offset_y = 5
    ctx.fillStyle = 'black';
    ctx.fillRect(offset_x,offset_y,100,410);
    ctx.strokeStyle = 'grey';
    ctx.strokeRect(offset_x,offset_y,100,410);
    for (var piece_idx=1; piece_idx<6; piece_idx++){
        ctx.fillStyle = color_table[game.bag[piece_idx]]
        for (var [col, row] of game.to_shape(game.bag[piece_idx])){
            var piece_offset = 'IO'.includes(game.bag[piece_idx])? 10: 20;
            ctx.fillRect((col+1)*20+offset_x+piece_offset,(3-row)*20+(piece_idx-1)*80+offset_y,20,20);

        }
    }

    // render game stat
    ctx.fillStyle = 'green';
    ctx.font = "bold 20px Arial ";
    if (game.line_clear>0 && game.line_clear<4 && game.b2b>=0)ctx.fillText('TSPIN',10,150)
    if (game.line_clear>0)ctx.fillText(['','Single','Double','Triple','Quad'][game.line_clear],10,200)
    if (game.combo > 0) ctx.fillText(game.combo+' Combo',10,300)
    if (game.pc) ctx.fillText('All Clear',10,350)

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

// a held key that starts repeating is one DAS input, and a DAS still held from the previous piece is a new input for this one
function record_das(direction){
    var held = direction == 'Left'? 'left_input': 'right_input'
    if (!Finesse.inputs.includes(Finesse[held]))
        Finesse[held] = record_input(direction)
    Finesse[held].name = 'DAS ' + direction
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

function hold(){
    record_input('Hold')
    game.hold()
}

// called by Game on top out: start a new board but keep the stats
function retry(){
    game = new Game()
    Finesse.target = null
    Finesse.wrong_spot = ''
    start_turn()
    render()
}

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
4. keybind
*/
function press_left(first_call = false){

    if (first_call && !Config.pressing_left){
        Config.timer1 = new Date().getTime();
        Config.delay = Config.das;
        Finesse.left_input = record_input('Left')
        game.move_left()
        render();
        Config.pressing_left = true;
        Config.pressing_right = false;
        setTimeout(press_left, 1)
    }

    else if (!first_call && Config.pressing_left){
        var now = new Date().getTime()
        if (now - Config.timer1 > Config.delay){
            record_das('Left')
            Config.arr===0? game.move_leftmost(): game.move_left()
            render();
            Config.delay = Config.arr
            Config.timer1 = now
        }
        setTimeout(press_left, 1)
    }
}
function release_left(){
    Config.pressing_left = false;
}

function press_right(first_call = false){

    if (first_call && !Config.pressing_right){
        Config.timer2 = new Date().getTime();
        Config.delay = Config.das;
        Finesse.right_input = record_input('Right')
        game.move_right()
        render();
        Config.pressing_right = true;
        Config.pressing_left = false;
        setTimeout(press_right, 1)
    }

    else if (!first_call && Config.pressing_right){
        var now = new Date().getTime()
        if (now - Config.timer2 > Config.delay){
            record_das('Right')
            Config.arr===0? game.move_rightmost(): game.move_right()
            render();
            Config.delay = Config.arr
            Config.timer2 = now
        }
        setTimeout(press_right, 1)
    }
}
function release_right(){
    Config.pressing_right = false;
}

function press_down(first_call = false){
    if (first_call && !Config.pressing_down){
        Finesse.down_input = record_input('Soft Drop')
        game.softdrop()
        render();
        Config.pressing_down = true;
        setTimeout(press_down, 1)
    }
    else if (!first_call && Config.pressing_down){
        var previous_y = game.y
        game.softdrop()
        // a soft drop still held from the previous piece is a new input for this one
        if (game.y != previous_y && !Finesse.inputs.includes(Finesse.down_input))
            Finesse.down_input = record_input('Soft Drop')
        render();
        setTimeout(press_down, 1)
    }
}

function release_down(){
    Config.pressing_down = false;
}

function add_generic_keybind(key,func){
    Keybind.keydown[key] = e=>{if (!Config.pressing[key]) func();
        render();
        Config.pressing[key] = true;
    }
    Keybind.keyup[key] = e=>{Config.pressing[key] = false}

}

function update_keybind(){
    Keybind.keydown = {}
    Keybind.keyup = {}

    Keybind.keydown[Customized_key[0]] = e=>{press_left(true)}
    Keybind.keyup[Customized_key[0]] = e=>{release_left(true)}

    Keybind.keydown[Customized_key[1]] = e=>{press_right(true)}
    Keybind.keyup[Customized_key[1]] = e=>{release_right(true)}

    Keybind.keydown[Customized_key[2]] = e=>{press_down(true)}
    Keybind.keyup[Customized_key[2]] = e=>{release_down(true)}

    add_generic_keybind(Customized_key[3], ()=> hard_drop())
    add_generic_keybind(Customized_key[4], ()=> (record_input('CCW'), game.rotate_anticlockwise()))
    add_generic_keybind(Customized_key[5], ()=> (record_input('CW'), game.rotate_clockwise()))
    add_generic_keybind(Customized_key[6], ()=> (record_input('180'), game.rotate_180()))
    add_generic_keybind(Customized_key[7], ()=> hold())
    add_generic_keybind(Customized_key[8], ()=> restart())

}

function set_event_listener(){
    document.onkeydown = (e => {
        var func = Keybind.keydown[e.code];
        if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){
            e.preventDefault()}
        if (document.activeElement.className == 'keybind'){
            document.activeElement.value = e.code
            save_setting()

        }
        if (document.activeElement.tagName != 'INPUT' && func != undefined){
            board.focus()
            func()
        }


    })

    document.onkeyup = (e => {
        var func = Keybind.keyup[e.code];
        if (func != undefined){
            func()
        }
        })

    board.onfocus = (e =>{
        render()

    })

    board.onblur = (e =>{
        var ctx = document.getElementById("board").getContext('2d');
        if (!Config.on_focus){
            ctx.font = "bold 40px Arial ";

            ctx.fillStyle = 'rgba(234,200,0,0.5)'
            ctx.fillText('          OUT OF FOCUS',0,300)

        }

    })
    document.getElementById('input11').oninput = e=>{save_setting()}
    document.getElementById('input12').oninput = e=>{save_setting()}
    document.getElementById('redo_ind').onchange = e=>{save_gamemode()}
    document.getElementById('grey_ind').onchange = e=>{save_gamemode()}
    document.getElementById('rotate180_ind').onchange = e=>{save_gamemode()}

    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        document.getElementById('board').onblur = (e=>e.preventDefault())
        document.getElementById('tcc').style.display = 'inline-block';
    } else if (
        /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)
    ) {
        document.getElementById('board').onblur = (e=>e.preventDefault())
        document.getElementById('tcc').style.display = 'inline-block';
    }


    document.getElementById('tc-dr').addEventListener('touchstart', function (e) {
        record_input('180')
        game.rotate_180()
        render()
    });
    document.getElementById('tc-h').addEventListener('touchstart', function (e) {
        hold()
        render()
    });
    document.getElementById('tc-hd').addEventListener('touchstart', function (e) {
        hard_drop()
        render()
    });
    document.getElementById('tc-l').addEventListener('touchstart', function (e) {
        press_left(true)
        render()
    });
    document.getElementById('tc-l').addEventListener('touchend', function (e) {
        release_left(true)
        render()
    });
    document.getElementById('tc-r').addEventListener('touchstart', function (e) {
        press_right(true)
        render()
    });
    document.getElementById('tc-r').addEventListener('touchend', function (e) {
        release_right(true)
        render()
    });
    document.getElementById('tc-d').addEventListener('touchstart', function (e) {
        press_down(true)
        render()
    });
    document.getElementById('tc-d').addEventListener('touchend', function (e) {
        release_down(true)
        render()
    });
    document.getElementById('tc-cc').addEventListener('touchstart', function (e) {
        record_input('CCW')
        game.rotate_anticlockwise()
        render()
    });
    document.getElementById('tc-c').addEventListener('touchstart', function (e) {
        record_input('CW')
        game.rotate_clockwise()
        render()
    });

}

/*
5. start
*/
set_event_listener()
load_setting()
load_gamemode()
update_keybind()
start_turn()
update_stats()
board.focus()
render()
