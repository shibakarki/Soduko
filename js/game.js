document.addEventListener('DOMContentLoaded', () => {
    const gridElement = document.getElementById('sudoku-grid');
    const timerElement = document.getElementById('timer');
    const mistakesCounter = document.getElementById('mistakes-counter');
    const statusMessageElement = document.getElementById('status-message');
    const undoBtn = document.getElementById('undo-btn');
    const eraseBtn = document.getElementById('erase-btn');
    const notesBtn = document.getElementById('notes-btn');
    const hintBtn = document.getElementById('hint-btn');
    const themeBtn = document.getElementById('theme-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const numberControls = document.getElementById('number-controls');

    let puzzle = [];
    let solution = [];
    let initialPuzzle = [];
    let selectedCell = null;
    let timerInterval;
    let timeElapsed = 0;
    let notesMode = false;
    let mistakes = 0;
    let moveHistory = [];
    let currentDifficulty = 'easy';
    let gameOver = false;

    const difficultyLevels = {
        easy: 30, medium: 45, hard: 55, expert: 60, master: 65, extreme: 70
    };

    // ====== Sudoku generation functions ======
    function generateSudoku(difficulty) {
        const holes = difficultyLevels[difficulty];
        solution = createSolvedBoard();
        const initialBoard = JSON.parse(JSON.stringify(solution));
        const removedBoard = removeCells(initialBoard, holes);
      
        initialPuzzle = removedBoard.map(row => row.map(val => ({ value: val, notes: [] })));
        puzzle = JSON.parse(JSON.stringify(initialPuzzle));
        return { puzzle: initialPuzzle, solution };
    }

    function createSolvedBoard() {
        const board = Array.from({ length: 9 }, () => Array(9).fill(0));
        fillBoard(board);
        return board;
    }

    function fillBoard(board) {
        function solve() {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        const numbers = shuffleArray([1,2,3,4,5,6,7,8,9]);
                        for (const num of numbers) {
                            if (isValid(board, row, col, num)) {
                                board[row][col] = num;
                                if (solve()) return true;
                                board[row][col] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        }
        solve();
    }

    function isValid(board,row,col,num){
        for(let i=0;i<9;i++){
            if(board[row][i]===num || board[i][col]===num) return false;
        }
        const startRow=Math.floor(row/3)*3;
        const startCol=Math.floor(col/3)*3;
        for(let i=0;i<3;i++){
            for(let j=0;j<3;j++){
                if(board[startRow+i][startCol+j]===num) return false;
            }
        }
        return true;
    }

    function shuffleArray(array){
        for(let i=array.length-1;i>0;i--){
            const j=Math.floor(Math.random()*(i+1));
            [array[i],array[j]]=[array[j],array[i]];
        }
        return array;
    }

    function removeCells(board,count){
        let cellsToRemove=count;
        while(cellsToRemove>0){
            let filledPositions=[];
            for(let row=0;row<9;row++){
                for(let col=0;col<9;col++){
                    if(board[row][col]!==0) filledPositions.push({row,col});
                }
            }
            if(filledPositions.length===0) break;
            shuffleArray(filledPositions);
            let removed=false;
            for(const pos of filledPositions){
                const row=pos.row,col=pos.col;
                const backup=board[row][col];
                board[row][col]=0;
                if(countSolutions(JSON.parse(JSON.stringify(board)))===1){
                    removed=true;
                    cellsToRemove--;
                    break;
                } else board[row][col]=backup;
            }
            if(!removed) break;
        }
        return board;
    }

    function countSolutions(board){
        let solutions=0;
        function solve(){
            if(solutions>1) return true;
            for(let row=0;row<9;row++){
                for(let col=0;col<9;col++){
                    if(board[row][col]===0){
                        for(let num=1;num<=9;num++){
                            if(isValid(board,row,col,num)){
                                board[row][col]=num;
                                if(solve()) return true;
                                board[row][col]=0;
                            }
                        }
                        return false;
                    }
                }
            }
            solutions++;
            return solutions>1;
        }
        solve();
        return solutions;
    }

    // ====== Render & Highlight ======
    function renderGrid(currentPuzzle){
        gridElement.innerHTML='';
        for(let row=0;row<9;row++){
            for(let col=0;col<9;col++){
                const cell=document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row=row;
                cell.dataset.col=col;
                const cellData=currentPuzzle[row][col];
                if(cellData.value!==0) cell.textContent=cellData.value;
                else if(cellData.notes && cellData.notes.length>0){
                    const notesContainer=document.createElement('div');
                    notesContainer.classList.add('cell-notes');
                    for(let i=1;i<=9;i++){
                        const noteSpan=document.createElement('span');
                        noteSpan.classList.add('note-number');
                        if(cellData.notes.includes(i)) noteSpan.textContent=i;
                        notesContainer.appendChild(noteSpan);
                    }
                    cell.appendChild(notesContainer);
                }
                if(initialPuzzle[row][col].value!==0) cell.classList.add('fixed');
                if(col===2||col===5) cell.classList.add('block-border-right');
                if(row===2||row===5) cell.classList.add('block-border-bottom');
                gridElement.appendChild(cell);
            }
        }
        checkAllConflicts();
    }

    function checkAllConflicts(){
        document.querySelectorAll('.cell').forEach(cell=>{
            cell.classList.remove('conflict','error');
            const row=parseInt(cell.dataset.row);
            const col=parseInt(cell.dataset.col);
            const value=puzzle[row][col].value;
            if(value!==0 && isConflict(row,col,value)) cell.classList.add('conflict');
            if(value!==0 && value!==solution[row][col]) cell.classList.add('error');
        });
    }

    function isConflict(row,col,value){
        for(let i=0;i<9;i++){
            if(i!==col && puzzle[row][i].value===value) return true;
            if(i!==row && puzzle[i][col].value===value) return true;
        }
        const startRow=Math.floor(row/3)*3;
        const startCol=Math.floor(col/3)*3;
        for(let i=0;i<3;i++){
            for(let j=0;j<3;j++){
                if((startRow+i!==row || startCol+j!==col) && puzzle[startRow+i][startCol+j].value===value) return true;
            }
        }
        return false;
    }

    function highlightCells(){
        document.querySelectorAll('.cell').forEach(cell=>cell.classList.remove('selected','highlighted','same-number'));
        if(!selectedCell) return;
        const selectedRow=parseInt(selectedCell.dataset.row);
        const selectedCol=parseInt(selectedCell.dataset.col);
        const selectedValue=puzzle[selectedRow][selectedCol].value;
        selectedCell.classList.add('selected');
        for(let i=0;i<9;i++){
            document.querySelector(`.cell[data-row='${selectedRow}'][data-col='${i}']`)?.classList.add('highlighted');
            document.querySelector(`.cell[data-row='${i}'][data-col='${selectedCol}']`)?.classList.add('highlighted');
        }
        const startRow=Math.floor(selectedRow/3)*3;
        const startCol=Math.floor(selectedCol/3)*3;
        for(let i=0;i<3;i++){
            for(let j=0;j<3;j++){
                document.querySelector(`.cell[data-row='${startRow+i}'][data-col='${startCol+j}']`)?.classList.add('highlighted');
            }
        }
        if(selectedValue){
            document.querySelectorAll('.cell').forEach(cell=>{
                if(puzzle[parseInt(cell.dataset.row)][parseInt(cell.dataset.col)].value===selectedValue){
                    cell.classList.add('same-number');
                }
            });
        }
    }

    // ====== Handle Input ======
    function handleInput(value){
        if(gameOver || !selectedCell || selectedCell.classList.contains('fixed')) return;
        const row=parseInt(selectedCell.dataset.row);
        const col=parseInt(selectedCell.dataset.col);
        const oldValue=puzzle[row][col].value;
        const oldNotes=[...(puzzle[row][col].notes||[])];

        if(notesMode){
            let notes=puzzle[row][col].notes||[];
            const index=notes.indexOf(value);
            if(index>-1) notes.splice(index,1);
            else { notes.push(value); notes.sort(); }
            puzzle[row][col].notes=notes;
            puzzle[row][col].value=0;
        } else {
            const newValue=value===oldValue?0:value;
            puzzle[row][col].value=newValue;
            puzzle[row][col].notes=[];

            if(newValue!==0){
                if(newValue!==solution[row][col]){
                    mistakes++;
                    mistakesCounter.textContent=`${mistakes}/3`;
                    sudokuSounds.wrongSound(); // Wrong placement sound
                    if(mistakes>=3){
                        statusMessageElement.textContent="Game over! Too many mistakes.";
                        statusMessageElement.classList.remove('text-green-600');
                        statusMessageElement.classList.add('text-red-600');
                        clearInterval(timerInterval);
                        gameOver=true;
                        sudokuSounds.gameOverSound(); // Game over sound
                    } else {
                        statusMessageElement.textContent="Incorrect number!";
                        statusMessageElement.classList.remove('text-green-600');
                        statusMessageElement.classList.add('text-red-600');
                    }
                } else {
                    statusMessageElement.textContent="Correct!";
                    statusMessageElement.classList.remove('text-red-600');
                    statusMessageElement.classList.add('text-green-600');

                    // Check if row/column/box completed → play corresponding sound
                    if(isBoxComplete(row,col)) sudokuSounds.boxFillSound();
                    else if(isLineComplete(row,col)) sudokuSounds.lineFillSound();

                    checkCompletion();
                }
            } else statusMessageElement.textContent="";
        }

        renderGrid(puzzle);
        moveHistory.push({row,col,oldValue,newValue:puzzle[row][col].value,oldNotes,newNotes:[...(puzzle[row][col].notes||[])]});
        highlightCells();
    }

    function isLineComplete(row,col){
        // Check row
        for(let i=0;i<9;i++) if(puzzle[row][i].value!==solution[row][i]) return false;
        // Check col
        for(let i=0;i<9;i++) if(puzzle[i][col].value!==solution[i][col]) return false;
        return true;
    }

    function isBoxComplete(row,col){
        const startRow=Math.floor(row/3)*3;
        const startCol=Math.floor(col/3)*3;
        for(let i=0;i<3;i++){
            for(let j=0;j<3;j++){
                if(puzzle[startRow+i][startCol+j].value!==solution[startRow+i][startCol+j]) return false;
            }
        }
        return true;
    }

    function checkCompletion(){
        let isComplete=true;
        for(let row=0;row<9;row++){
            for(let col=0;col<9;col++){
                if(puzzle[row][col].value!==solution[row][col]){
                    isComplete=false; break;
                }
            }
            if(!isComplete) break;
        }
        if(isComplete){
            clearInterval(timerInterval);
            statusMessageElement.textContent="Congratulations! You've solved the puzzle!";
            statusMessageElement.classList.remove('text-red-600');
            statusMessageElement.classList.add('text-green-600');
            gameOver=true;
            sudokuSounds.winSound(); // Win sound
        }
    }

    function undoMove(){
        if(gameOver || moveHistory.length===0) return;
        const lastMove=moveHistory.pop();
        const {row,col,oldValue,oldNotes}=lastMove;
        puzzle[row][col].value=oldValue;
        puzzle[row][col].notes=oldNotes;
        renderGrid(puzzle);
        highlightCells();
        statusMessageElement.textContent="Undo successful.";
    }

    // ====== Event Listeners ======
    gridElement.addEventListener('click',(e)=>{
        if(gameOver) return;
        let targetCell=e.target;
        if(targetCell.classList.contains('note-number')) targetCell=targetCell.closest('.cell');
        if(targetCell && targetCell.classList.contains('cell')){
            if(selectedCell) selectedCell.classList.remove('selected');
            selectedCell=targetCell;
            highlightCells();
        }
    });

    numberControls.addEventListener('click',(e)=>{
        if(gameOver) return;
        if(e.target.classList.contains('number-btn')){
            sudokuSounds.playSound('click'); // number click
            handleInput(parseInt(e.target.dataset.value));
        }
    });

    eraseBtn.addEventListener('click',()=>{
        if(gameOver || !selectedCell || selectedCell.classList.contains('fixed')) return;
        const row=parseInt(selectedCell.dataset.row);
        const col=parseInt(selectedCell.dataset.col);
        const oldValue=puzzle[row][col].value;
        const oldNotes=[...(puzzle[row][col].notes||[])];

        puzzle[row][col].value=0;
        puzzle[row][col].notes=[];
        renderGrid(puzzle);
        selectedCell.classList.remove('error');
        statusMessageElement.textContent="";
        highlightCells();
        moveHistory.push({row,col,oldValue,newValue:0,oldNotes,newNotes:[]});
    });

    notesBtn.addEventListener('click',()=>{
        if(gameOver) return;
        notesMode=!notesMode;
        notesBtn.classList.toggle('active',notesMode);
    });

    undoBtn.addEventListener('click',undoMove);

    newGameBtn.addEventListener('click',()=>initGame(currentDifficulty));

    difficultyButtons.forEach(button=>{
        button.addEventListener('click',()=>{
            initGame(button.dataset.difficulty);
        });
    });

    hintBtn.addEventListener('click',()=>{
        sudokuSounds.playSound('hintReceived'); // hint sound
        getHint();
    });

    themeBtn.addEventListener('click',()=>document.documentElement.classList.toggle('dark-theme'));

    // ====== Timer & Init ======
    function startTimer(){
        clearInterval(timerInterval);
        timeElapsed=0;
        timerElement.textContent='00:00';
        timerInterval=setInterval(()=>{
            timeElapsed++;
            const minutes=Math.floor(timeElapsed/60).toString().padStart(2,'0');
            const seconds=(timeElapsed%60).toString().padStart(2,'0');
            timerElement.textContent=`${minutes}:${seconds}`;
        },1000);
    }

    function initGame(difficulty){
        currentDifficulty=difficulty;
        generateSudoku(currentDifficulty);
        renderGrid(puzzle);
        selectedCell=null;
        statusMessageElement.textContent="";
        mistakes=0;
        mistakesCounter.textContent="0/3";
        moveHistory=[];
        gameOver=false;
        startTimer();
    }

    // ====== Keyboard Navigation ======
    document.addEventListener('keydown',(e)=>{
        if(gameOver || !selectedCell) return;
        let row=parseInt(selectedCell.dataset.row);
        let col=parseInt(selectedCell.dataset.col);
        let newCell=null;
        switch(e.key){
            case 'ArrowUp': newCell=document.querySelector(`.cell[data-row='${row>0?row-1:8}'][data-col='${col}']`); break;
            case 'ArrowDown': newCell=document.querySelector(`.cell[data-row='${row<8?row+1:0}'][data-col='${col}']`); break;
            case 'ArrowLeft': newCell=document.querySelector(`.cell[data-row='${row}'][data-col='${col>0?col-1:8}']`); break;
            case 'ArrowRight': newCell=document.querySelector(`.cell[data-row='${row}'][data-col='${col<8?col+1:0}']`); break;
            case 'Backspace': case 'Delete': e.preventDefault(); eraseBtn.click(); break;
            case '1': case '2': case '3': case '4': case '5':
            case '6': case '7': case '8': case '9': handleInput(parseInt(e.key)); break;
        }
        if(newCell){
            selectedCell.classList.remove('selected');
            selectedCell=newCell;
            highlightCells();
        }
    });

    // ====== Initialize ======
    initGame(currentDifficulty);
});
