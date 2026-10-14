// map generation shared by the modes that build their own maps: downstack, PC, T-spin, quad,
// advanced T-spin, T-spin challenge and upstack practice
// a mode script is loaded after this one and can replace any of these with its own version

// 4.1 add line

function add_line(row_idx,log=true){
    for (var i=0; i<10; i++){
        for (var j=19; j>row_idx; j--){
            game.board[j][i] = game.board[j-1][i]
        }
        game.board[row_idx][i] = 'G'
    }
    if (log)
        Record.added_line.push(row_idx)
}

function add_random_line(){
    var max_height = game.get_max_height()

    var row_index = Math.floor(Math.random()*(max_height+2))
    Record.added_line = []
    var rng = Math.random()
    if (rng<0.05){
        add_line(row_index)
        add_line(row_index+1)
        add_line(row_index+2)
    }
    else if (rng<0.07 && row_index < max_height+1){
        add_line(row_index)
        add_line(row_index+2)
    }
    else if (rng<0.15){
        add_line(row_index)
        add_line(row_index+1)
    }
    else if (rng<0.3){
        add_line(row_index)
    }
}

function add_random_line_less_skim(){
    var non_garbages = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (var row_idx=0; row_idx<20; row_idx++)
        for (var col_idx=0; col_idx<10; col_idx++)
            if (game.board[row_idx][col_idx] != 'G')
                non_garbages[row_idx] += 1

    var garbage_height = 0
    for (var num of non_garbages){
        if (num == 1)
            garbage_height+=1
        else
            break}
    var row_index = garbage_height
    Record.added_line = []
    var rng = Math.random()
    if (rng<0.05){
        add_line(row_index)
        add_line(row_index+1)
        add_line(row_index+2)
    }
    else if (rng<0.15 ){
        add_line(row_index)
        add_line(row_index+1)
    }
    else if (rng<0.3){
        add_line(row_index)
    }
}

// 4.2 validation test

function try_drop(){//return whether garbage below current piece can be converted to current piece in current column
    var shape = game.to_shape()
    var heights = []
    for (var[c,r] of shape) heights.push(r)
    var lowest_height = Math.min(...heights)

    var min_relative_height = 20
    for (var [col, row] of shape){
        var ground_height = 0
        for (var i=0; i<row; i++)
            if (game.board[i][col] == 'G')
                ground_height = i+1
        min_relative_height = Math.min(min_relative_height, row - ground_height)
    }


    for (var fall=min_relative_height+1; fall<=lowest_height; fall++){

        var all_g = true

        for (var [col, row] of shape){
            if (game.board[row-fall][col] != 'G'){
                all_g = false
                break
            }
        }
        if (all_g){
            for (var [col, row] of shape){
                game.board[row-fall][col] = 'N'}
            game.y -= fall
            return true
        }
    }
    return false

}

function is_exposed(){//return whether exist garbage above current piece
    for (var [col, row] of game.to_shape()){
        for (var j=row+1; j<20; j++){
            if (game.board[j][col] == 'G'){
                return false}}}
    return true}

function is_floatable(){//return whether exist garbage 1 block below current piece
    for (var [col, row] of game.to_shape()){
        if (row == 0 || game.board[row-1][col] == 'G'){
            return false}}
    return true}

function is_spinable(depth = 1){
    if (depth > 2){
        return false}
    var piece_info = [game.x, game.y, game.orientation]

    if (depth == 2){
        if (game.move_left()){
            if (is_exposed() && ! is_floatable()){
                game.x += 1
                return true
            }
        }
        if (game.move_right()){
            if (is_exposed() && ! is_floatable()){
                game.x -= 1
                return true
            }
        }
    }
    if (game.rotate_clockwise()){
        if ((is_exposed() && ! is_floatable()) || is_spinable(depth+1)){
            game.rotate_anticlockwise()
            if (piece_info[0]==game.x && piece_info[1]==game.y && piece_info[2]==game.orientation){
                return true}
        }
    }

    [game.x, game.y, game.orientation] = piece_info
    if (game.rotate_anticlockwise()){
        if ((is_exposed() && ! is_floatable()) || is_spinable(depth+1)){
            game.rotate_clockwise()
            if (piece_info[0]==game.x && piece_info[1]==game.y && piece_info[2]==game.orientation){
                return true}
        }
    }


    [game.x, game.y, game.orientation] = piece_info
    if (game.rotate_180()){
        if ((is_exposed() && ! is_floatable())){

            game.rotate_180()
            return true
        }
    }

    return false
}

function get_unstability(){
    var grounded_position = new Set()
    var ungrounded_position = new Set()
    for (var col_idx=0; col_idx<10; col_idx++) {
        var is_grounded = true
        for (var row_idx=0; row_idx<20; row_idx++){
            if (game.board[row_idx][col_idx] == 'G'){
                if (is_grounded){
                    grounded_position.add(JSON.stringify([row_idx,col_idx]))}
                else{
                    ungrounded_position.add([row_idx,col_idx])}
            }
            else{
                is_grounded = false}
        }
    }

    //test if ungrounded are next to grounded
    var unstability = 0
    for (var [row_idx, col_idx] of ungrounded_position){

        var right_grounded = (col_idx < 9) &&  grounded_position.has(JSON.stringify([row_idx, col_idx+1]))
        var left_grounded = (col_idx > 0) && grounded_position.has(JSON.stringify([row_idx, col_idx-1]))
        if (! (right_grounded || left_grounded)){
            unstability += 1}
    }
    return unstability}

function is_smooth(arr){
    var uped = false
    var downed = false
    var last = null
    for (var ele of arr){
        if (last == null){
            last = ele
        }
        else{

            if (ele - last >1){
                uped = true
            }
            else if (last - ele >1){
                if (uped) return false
                downed = true
            }
            last = ele
        }
    }
    return true
}

// 4.3 try to add pieces

function try_a_piece(){
    // find position piece that include (x,y)
    // find neighbour piece
    if (try_drop()){

        //pass test if the piece is reachable , the added line is clearable , the piece is not floatable , unstability == 0 and there are few holes
        var test = ! is_floatable()
        var shape = game.to_shape()
        test = test && Record.added_line.every(val => shape.some(pos => val==pos[1]))
        test = test && is_few_non_cheese_hole()
        test = test && (get_unstability() == 0)
        test = test && (is_exposed() || is_spinable())
        for (var [col, row] of shape){
            game.board[row][col] = "G"
        }
        return test

    }

    return false
}

function is_unique(bag){
    counter = {I:0, O:0, T:0, J:0, L:0, Z:0, S:0}
    for (var piece of bag){
        counter[piece] += 1
        if (counter[piece] > 1)
            return false
        if (piece == last_piece)
            return false
        last_piece = piece
    }
    return true
}

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

function try_a_move(){
    //step 1 add line
    if (Config.skim_ind){
        add_random_line()}
    //step 2 try to add piece
    if (try_all_pieces()){
        game.lock()
        Record.board.push(clone(game.board))
        return true
    }
    else{
        return false}
}

function is_good_queue(queue){
    var accum = []
    var count = 1
    for (var ele of queue){
        if (accum.includes(ele)){
            accum = []
            count ++
        }
        accum.push(ele)
    }
    return count <= 2
}

function get_shuffled_holdable_queue(queue){

    var size = queue.length
    if (2<= size && size<=7){
        var selected_table = reverse_hold_table[size]
        shuffle(selected_table)
        for (var selected_row of selected_table){
            var result = []
            for (var pointer of selected_row){
                result.push(queue[pointer])
            }
            if (is_good_queue(result)){

                return result
            }
        }

    }
    return []
}

// 4.5 generate the final map and develop the progression

count = 0
last_info = 'null'
function generate_a_ds_map(move){


    for (var trial=0; trial<5; trial++){
        if (move == 1){
            success_generate = try_a_move()}
        else{
            success_generate = try_a_move() && generate_a_ds_map(move - 1)}
        if (success_generate){
            return true}
        else{
            count++
            var info = `${game.tetramino} ${game.x} ${game.y} ${game.orientation}`
            if (info == last_info)
                {trial = 5}
            last_info = info

            Record.board.length = Config.no_of_unreserved_piece-move
            Record.piece_added.length = Config.no_of_unreserved_piece-move
            if (Record.board.length > 0){
                game.board = clone(Record.board[Record.board.length-1])}
            else{
                game.board = clone(Record.finished_map)}
        }
    }
    return false
}

function all_grounded(){
    for (var col_idx=0; col_idx<10; col_idx++) {
        var is_grounded = true
        for (var row_idx=0; row_idx<20; row_idx++){
            if (game.board[row_idx][col_idx] != 'N'){
                if (!is_grounded){
                return false}

            }
            else{
                is_grounded = false}
        }
    }
    return true
}
