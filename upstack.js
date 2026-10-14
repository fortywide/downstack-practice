Object.assign(Config, {'skim_ind':false, 'mdhole_ind':false, 'unqiue_ind':true, 'smooth_ind':true, 'auto_next_ind':true,
'mode':'prepare', 'no_of_unreserved_piece':7, 'no_of_piece':7,
'no_of_trial':0, 'no_of_success':0, 'blank_col':0, 'quad_col':0})

/*
1. html related
*/

function load_gamemode(){
    document.getElementById('input13').value = Config.no_of_piece

    document.getElementById('input15').checked = Config.mdhole_ind

}

function save_gamemode(){
    console.log('save_gamemode')
    Config.no_of_piece = parseInt(document.getElementById('input13').value)
    if (! (Config.no_of_piece>=2 && Config.no_of_piece<=7)){
        alert('no of piece should be between 2 to 7')
        Config.no_of_piece = 7
    }

    Config.mdhole_ind = document.getElementById('input15').checked 

}

function set_gamemode_listener(){
    document.getElementById('input13').oninput = e=>{save_gamemode()}
    document.getElementById('input15').onchange = e=>{save_gamemode()}
}

/*
4. map generation
*/
Record={
    added_line:[],
    board:[],
    board_rounds:[],
    piece_added:[],
    queue_rounds:[],
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
    quad: 0,
    tsd: 0,
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
        if (height_copy[8] - height_copy[1] > 5 || height_copy[9] - height_copy[1] > 7 || height_copy[9] - height_copy[8] >3)
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
    Record.quad = 0
    Record.tsd = 0
    game.bag = Record.queue_rounds.concat(['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'])
    game.update()
    game.holdmino = ''
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
    if (Config.mode == 'quad'){
        var height = []
        for (var i=0; i<10; i++)
            height.push(Math.floor(Math.random()*3)+5)

        var blank_col = Math.random()>0.5? Config.quad_col: 9-Config.quad_col
        height[blank_col] = 0

        Config.blank_col = blank_col
        
        for (var j=0; j<20; j++){
            for (var i=0; i<10; i++){
                if (j < height[i]){
                    game.board[j][i] = 'G'}}}

    }
}
function clear_color(){
    for (var row_idx=0; row_idx<20; row_idx++){
        for (var col_idx=0; col_idx<10; col_idx++){
            if (game.board[row_idx][col_idx] != 'G'){
                game.board[row_idx][col_idx] = 'N'}}}
}

function add_cleared_line(mode){
    if (mode == 'quad'){
        var min_height = 20
        for (var col_idx=0; col_idx<10; col_idx++){
            var height = 0
            if (col_idx==Config.blank_col) continue
            for (var row_idx=0; row_idx<4; row_idx++){
                var height = row_idx
                if (game.board[row_idx][col_idx] != 'G')
                    break
            }

            min_height = Math.min(min_height, height)
        }

        for (var i=0; i<4; i++){
            add_line(0, log=false)
            game.board[0][Config.blank_col]='N'
        }
        
    }
}

function play_map(mode = null, times = 3, round_idx = 1){
    if (mode == null){
        mode = Config.mode}
    if (round_idx == 1){
        Record.board_rounds = []
        Record.queue_rounds = []
        game = new Game()
    }
    Config.no_of_unreserved_piece = Config.no_of_piece - ['quad'].includes(mode)
    Config.mode = mode
    
    if (round_idx == 1) generate_final_map()
    Record.finished_map = clone(game.board)
    game.drawmode = true
    Record.piece_added = []
    Record.board = []
    var success_ind = false
    
    for (var i=0; i<33; i++) {
        if (generate_a_ds_map(Config.no_of_unreserved_piece) && game.get_max_height() < 17){
            var success_ind = true
            var queue = [...Record.piece_added].reverse()	
            if (Config.mode == 'quad'){	
                queue.push('I')}		
            Record.shuffled_queue = get_shuffled_holdable_queue(queue)
            if (Record.shuffled_queue.length >0){
                break}
        }
        else if (round_idx == 1 && i%2 == 1){
            game = new Game()
            generate_final_map()
            Record.finished_map = clone(game.board)
            game.drawmode = true
            Record.piece_added = []
            Record.board = []
        }
        
    }
    if (! success_ind) return false
    if (round_idx == times) {
        Record.board_rounds.push(clone(game.board))
        Record.queue_rounds = [...Record.shuffled_queue, ...Record.queue_rounds]
        play()
    
        game.drawmode = false
        render()
        return true
    }
    else{
        Record.board_rounds.push(clone(game.board))
        Record.queue_rounds = [...Record.shuffled_queue, ...Record.queue_rounds]
        clear_color()
        add_cleared_line(Config.mode)
        return play_map(mode, times, round_idx+1)
    }
    

}

function play_3_quad_map(quad_col=0){
    Config.quad_col = quad_col
    for (var i=0; i<33;i++){
        if (play_map('quad', 3))
            break

    }

    document.getElementById('winning_requirement1').innerHTML = 'Do 3 Quad (or tsd)'
    document.getElementById('winning_requirement2').innerHTML = 'Leave column '+(Config.blank_col+1)+' empty at the end'
}

function detect_win(){
    if (game.total_piece == 1){
        Config.no_of_trial += 1
    }
    if (game.line_clear == 2 && game.b2b >= 0) Record.tsd++
    if (game.line_clear == 4) Record.quad++
    if (Config.mode == 'quad' && Record.tsd+Record.quad >= 3 && game.board.every(row=>row[Config.blank_col]=="N")){
        sound['win'].play()
        if (Config.auto_next_ind){
            play_3_quad_map(Config.quad_col)}
        Config.no_of_success += 1
        }
    else if (game.total_piece == 21){

        sound['lose'].play()
        retry()

            
    }
    
}

function transcribe(n_line){
    if (n_line>0){
        for (var row_idx=0; row_idx < 20-n_line; row_idx++)
            for (var col_idx=0; col_idx<10; col_idx++)
                game.board[row_idx][col_idx] = game.board[row_idx+n_line][col_idx]

        for (var row_idx=20-n_line; row_idx < 20; row_idx++)
            for (var col_idx=0; col_idx<10; col_idx++)
                game.board[row_idx][col_idx] = 'N'
            
    }
}
function show_ans(){
    if (Record.board.length>0){
        game.board = clone(Record.board_rounds[2])
        render()

        setTimeout(()=>{
            transcribe(4)
            render()}, 1500)

        setTimeout(()=>{
            game.board = clone(Record.board_rounds[1])
            render()}, 3000)

        setTimeout(()=>{
            transcribe(4)
            render()}, 4500)

        setTimeout(()=>{
            game.board = clone(Record.board_rounds[0])
            render()}, 6000)
        setTimeout(retry, 9000)
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
play_3_quad_map()
render()

