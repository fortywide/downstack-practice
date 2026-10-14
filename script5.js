Object.assign(Config, {'skim_ind':false, 'mdhole_ind':false, 'unqiue_ind':true, 'smooth_ind':true, 'auto_next_ind':true,
'mode':'prepare', 'no_of_unreserved_piece':7, 'no_of_piece':7,
'no_of_trial':0, 'no_of_success':0, 'blank_col':0})

/*
1. html related
*/

function load_gamemode(){
    document.getElementById('input13').value = Config.no_of_piece
    document.getElementById('input14').checked = Config.skim_ind
    document.getElementById('input15').checked = Config.mdhole_ind
    document.getElementById('input16').checked = Config.unqiue_ind
    document.getElementById('input17').checked = Config.smooth_ind
}

function save_gamemode(){
    console.log('save_gamemode')
    Config.no_of_piece = parseInt(document.getElementById('input13').value)
    if (! (Config.no_of_piece>=2 && Config.no_of_piece<=7)){
        alert('no of piece should be between 2 to 7')
        Config.no_of_piece = 7
    }
    Config.skim_ind = document.getElementById('input14').checked
    Config.mdhole_ind = document.getElementById('input15').checked 
    Config.unqiue_ind = document.getElementById('input16').checked
    Config.smooth_ind = document.getElementById('input17').checked
}

function set_gamemode_listener(){
    document.getElementById('input13').oninput = e=>{save_gamemode()}
    document.getElementById('input14').onchange = e=>{save_gamemode()}
    document.getElementById('input15').onchange = e=>{save_gamemode()}
    document.getElementById('input16').onchange = e=>{save_gamemode()}
    document.getElementById('input17').onchange = e=>{save_gamemode()}
}

/*
4. map generation
*/
Record={
    added_line:[],
    board:[],
    piece_added:[],
    shuffled_queue:['I','O','J','L','S','Z','T'],
    finished_map:[
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N']],
    done_quad: false,
    
}

// 4.1 add line
// 4.2 validation test

function is_few_non_cheese_hole(){
    var height = []
    for (var col_idx=0; col_idx<10; col_idx++) {
        var h=0
        for (var row_idx=0; row_idx<20; row_idx++){ 
            if (game.board[row_idx][col_idx] == 'G'){
                h=row_idx}}
        height.push(h)
    }

    if (Config.smooth_ind){
        if (! is_smooth(height))
         return false
        var height_copy = [...height].sort(function(a, b){return a - b})
        if (height_copy[8] - height_copy[1] > 5)
            return false
    }

    var holes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var non_garbages = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (var row_idx=0; row_idx<20; row_idx++) 
        for (var col_idx=0; col_idx<10; col_idx++){
            if (game.board[row_idx][col_idx] != 'G')
                non_garbages[row_idx] += 1
            if (game.board[row_idx][col_idx] != 'G' && row_idx < height[col_idx])
                holes[row_idx] += 1}

    
    var no_of_non_cheese_holes = 0
    var is_cheese_level = true
    for (var i=0; i<20; i++){
        var non_garbage = non_garbages[i]
        var hole = holes[i]
        if (non_garbage != 1){
            is_cheese_level = false}
        if (! is_cheese_level){
            no_of_non_cheese_holes += hole
        }
    }
    return no_of_non_cheese_holes <= Config.mdhole_ind
}

// 4.3 try to add pieces
function is_even_distributed(bag){
    var last_piece = null
    var counter = {I:0, O:0, T:0, J:0, L:0, Z:0, S:0}
    var limit = {I:2, O:2, T:2, J:2, L:2, Z:2, S:2}
    if (Config.unqiue_ind){
        limit = {I:1, O:1, T:1, J:1, L:1, Z:1, S:1}
    }
    if (Config.mode == 'quad'){
        limit.I -= 1}
    for (var piece of bag){
        
        counter[piece] += 1
        if (counter[piece] > limit[piece])
            return false
        if (piece == last_piece)
            return false
        last_piece = piece
    }
    if (counter.I + counter.J + counter.L >4){	
        return false	
    }
    return true
}

// replaces the shared version in mapgen.js
function try_all_pieces(){
    var seenbag = []
    var unseenbag = []
    for (var piece of 'IOTJLZS'){
        if (Record.piece_added.includes(piece)){
            seenbag.push(piece)
        }
        else{
            unseenbag.push(piece)
        }
    }
    shuffle(seenbag)
    shuffle(unseenbag)
    
    var bag = unseenbag.concat(seenbag)
    if (! Config.unqiue_ind){
        bag = shuffle([...'IOTJLZS'])
    }
    for (var piece of bag){
        if (! is_even_distributed(Record.piece_added.concat(piece))) continue
        shuffle(possible_piece_config_table[piece])
        for (var [ori_idx, col_idx] of possible_piece_config_table[piece]){
            game.tetramino = piece
            game.x = col_idx
            game.y = 18
            game.orientation = ori_idx
            
            if (try_a_piece()){
                Record.piece_added.push(piece)
                return true
            }
        }
    }
    return false
}

// 4.4 shuffle queue and play / restart
function play(){
    game = new Game()
    Record.done_quad = false
    game.bag = Record.shuffled_queue.concat(['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'])
    game.update()
    game.holdmino = ''
    game.hold()
    if ((Record.board.length)>0){
        game.board = clone(Record.board[Record.board.length-1])
        for (var row_idx=0; row_idx<20; row_idx++){
            for (var col_idx=0; col_idx<10; col_idx++){
                if (game.board[row_idx][col_idx] != 'G'){
                game.board[row_idx][col_idx] = 'N'}}}
    }
}
// 4.5 generate the final map and develop the progression
function generate_final_map(){
    game = new Game()
    if (Config.mode == 'quad'){
        var height = []
        for (var i=0; i<10; i++)
            height.push(Math.floor(Math.random()*3)+8)
        var gap_col = Math.floor(Math.random()*10)
        height[gap_col] = 4

        var blank_col = Math.floor(Math.random()*9)
        blank_col += (blank_col >= gap_col)
        height[blank_col] = 0

        Config.blank_col = blank_col
        
        for (var j=0; j<20; j++){
            for (var i=0; i<10; i++){
                if (j < height[i]){
                    game.board[j][i] = 'G'}}}

        game.board[4][blank_col] = 'G'
        game.board[5][blank_col] = 'G'
        game.board[6][blank_col] = 'G'
        game.board[7][blank_col] = 'G'
        game.board[8][blank_col] = 'N'
        game.board[9][blank_col] = 'N'
        game.board[10][blank_col] = 'N'
        
    }
}
function play_a_map(mode = null){
    if (mode == null){
        mode = Config.mode}
    
    game = new Game()

    Config.no_of_unreserved_piece = Config.no_of_piece - ['quad'].includes(mode)
    Config.mode = mode
    
    generate_final_map()
    Record.finished_map = clone(game.board)
    game.drawmode = true
    Record.piece_added = []
    Record.board = []
    
    for (var i=0; i<999; i++) {
        if (i==50){
            Config.skim_ind = false
        }
        if (generate_a_ds_map(Config.no_of_unreserved_piece) && game.get_max_height() < 17){
            var queue = [...Record.piece_added].reverse()	
            if (Config.mode == 'quad'){	
                queue.push('I')}		
            Record.shuffled_queue = get_shuffled_holdable_queue(queue)
            if (mode == 'quad'){
                if (Record.shuffled_queue.length >0 && game.board[4][Config.blank_col] == 'G'){	//only works for quad
                    break}
            }
            else{
                if (Record.shuffled_queue.length >0 ){
                    break}
            }
        }
        else if (i%2 == 1){
            generate_final_map()
            Record.finished_map = clone(game.board)
            game.drawmode = true
            Record.piece_added = []
            Record.board = []
        }
        
    }
            
    Config.skim_ind = document.getElementById('input14').checked
    
    play()
    
    game.drawmode = false
    render()
    // update_stat()
    // update_win_text()
}

function play_a_quad_map(){
    play_a_map('quad')
    document.getElementById('winning_requirement1').innerHTML = 'Do a Quad'
    document.getElementById('winning_requirement2').innerHTML = 'Leave column '+(Config.blank_col+1)+'empty at the end'
}

function detect_win(){
    if (game.total_piece == 1){
        Config.no_of_trial += 1
    }
    if (game.line_clear == 4) Record.done_quad = true
    if (game.total_piece == Config.no_of_piece){
        
        if (Config.mode == 'quad' && Record.done_quad && game.board.every(row=>row[Config.blank_col]=="N")){
            sound['win'].play()
            if (Config.auto_next_ind){
                play_a_quad_map()}
            Config.no_of_success += 1
        }
        else{
            sound['lose'].play()
            retry()
        }
            
    }
    
}

function show_ans(){
    if (Record.board.length>0){
        game.board = clone(Record.board[Record.board.length-1])
        render()
        setTimeout(retry, 3000)
}
}
/*
5. start
*/
set_event_listener()
set_gamemode_listener()
load_setting()
load_gamemode()
update_keybind()
board.focus()
play_a_quad_map()
render()

