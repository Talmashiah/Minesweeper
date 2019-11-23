'use strict';
var BOMB = '💣';
var FLAG = '🏴‍☠️';
var SMILEY = '🙂'
var DEATH = '☠️';
var WIN = '😎';
var HINT = '💡';
var gBoard;
var gElRstartButton = document.querySelector('.restart-button');
var gElFirstNumber = document.querySelector('.first-number');
var gElMiddleNumber = document.querySelector('.middle-number');
var gElLastNumber = document.querySelector('.last-number');
var gelFlagsCounter = document.querySelector('.flags-counter');
var gElHintPopup = document.querySelector('.hint-popup');
var gElbestScore = document.querySelector('.best-score');
var gFirstClick;
var gFirstRightClick = true;
var gTimerInterval;
var gFirst = 0;
var gMiddle = 0;
var gLast = 0;
var gHintsNumber = 3;
var gISHintClicked = false;
var gbestScore;

var gCurrLevel = {};

var gLevel = {
    beginner: { SIZE: 4, MINES: 2 },
    medium: { SIZE: 8, MINES: 12 },
    expert: { SIZE: 12, MINES: 30 }
};

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
};

var flagsCounter = gCurrLevel.MINES;

function timer() {
    if (gFirst < 9) {
        gFirst++;
        gElFirstNumber.innerText = gFirst;
    } else {
        gFirst = 0;
        gElFirstNumber.innerText = gFirst;
        gMiddle++;
        gElMiddleNumber.innerText = gMiddle;
        if (gMiddle > 9) {
            gMiddle = 0;
            gElMiddleNumber.innerText = gMiddle;
            gLast++;
            gElLastNumber.innerText = gLast;
        }
    }
}

function resetTimer() {
    gElFirstNumber.innerText = '0';
    gElMiddleNumber.innerText = '0';
    gElLastNumber.innerText = '0';
    gFirst = 0;
    gMiddle = 0;
    gLast = 0;
}

function init() {
    resetTimer();
    clearInterval(gTimerInterval);
    gFirstClick = true;
    gGame.isOn = true;
    gBoard = buildBoard();
    renderBoard(gBoard);
    gHintsNumber = 3;
    renderHints();
    gElRstartButton.innerText = SMILEY;
    gelFlagsCounter.innerText = gCurrLevel.MINES;
    flagsCounter = gCurrLevel.MINES;
    showBestScore();
}

function showBestScore() {
    var bestScores = localStorage.getItem('bestScores');
    var bestScores = JSON.parse(bestScores);

    if (bestScores) {
        for (var i = 0; i < bestScores.length; i++) {
            if (bestScores[i].level === gCurrLevel.name) {
                gbestScore = bestScores[i].score;
                if (gbestScore > 0) {
                    gElbestScore.innerText = `Best Score: ${gbestScore}`;
                } else {
                    gElbestScore.innerText = `There is no best score yet!`;
                }
                return;
            }
        }
    } else {
        gElbestScore.innerText = `There is no best score yet!`;
    }


}

function setBestScore() {
    var bestScores = localStorage.getItem('bestScores');
    var currScore = +(`${gLast}` + `${gMiddle}` + `${gFirst}`);

    if (bestScores) {
        var bestScores = JSON.parse(bestScores);

        for (var i = 0; i < bestScores.length; i++) {
            if (bestScores[i].level === gCurrLevel.name) {
                var currentBest = bestScores[i].score;
                if (currentBest === 0 || currentBest > currScore) {
                    bestScores[i].score = currScore;
                    localStorage.setItem('bestScores', JSON.stringify(bestScores));
                    gElbestScore.innerText = `Best Score: ${currScore}`;
                    return;
                }
            }
        }

    } else {
        bestScores = [];
        for (var prop in gLevel) {
            if (gCurrLevel.name === prop) {
                bestScores.push({ level: prop, score: currScore })
            }
            else {
                bestScores.push({ level: prop, score: 0 });
            }
        }
        localStorage.setItem('bestScores', JSON.stringify(bestScores));
        gElbestScore.innerText = `Best Score: ${currScore}`;
    }

}

function setBeginnerLevel() {
    gCurrLevel.SIZE = gLevel.beginner.SIZE;
    gCurrLevel.MINES = gLevel.beginner.MINES;
    gCurrLevel.name = 'beginner';
    init();
}

function setMediumLevel() {
    gCurrLevel.SIZE = gLevel.medium.SIZE;
    gCurrLevel.MINES = gLevel.medium.MINES;
    gCurrLevel.name = 'medium';
    init();
}

function setExpertLevel() {
    gCurrLevel.SIZE = gLevel.expert.SIZE;
    gCurrLevel.MINES = gLevel.expert.MINES;
    gCurrLevel.name = 'expert';
    init();

}

function setMinesNegsCount(posI, posJ) {
    var counter = 0;
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;

        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === posI && j === posJ) continue;

            if (gBoard[i][j].isMine) counter++;
        }
    }
    return counter;
}

function revealAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine) gBoard[i][j].isShown = true;


        }

    }
    renderBoard();
}

function renderBoard() {
    var strHTML = '';
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += '<tr>\n'
        for (var j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j];
            cell.minesAroundCount = setMinesNegsCount(i, j);
            var className = cell.isMine ? 'mine ' : '';
            className += cell.isShown ? 'show ' : '';
            className += cell.isMarked ? 'marked ' : '';
            className += `number${cell.minesAroundCount} `;
            strHTML += `\t<td
            class="${className}" oncontextmenu="rightMouseClicked(event, ${i}, ${j})" onclick="leftMouseClicked(${i}, ${j})">${contentOfCell(cell)}</td>\n`
        }
        strHTML += '</tr>\n'
    }

    var elCells = document.querySelector('.cells');
    elCells.innerHTML = strHTML;
    if (isWon()) {
        victorious();
    }
}

function contentOfCell(cell) {
    var cellContent = '';
    if (cell.isShown && cell.minesAroundCount > 0) cellContent = cell.minesAroundCount;
    if (cell.isMarked) cellContent = FLAG;
    if (cell.minesAroundCount === 0 && cell.isShown) cellContent = '';
    if (cell.isMine && cell.isShown) cellContent = BOMB;
    return cellContent;
}

function buildBoard() {
    var board = [];
    for (var i = 0; i < gCurrLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gCurrLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }

    }
    return setRandomMinesOnBoard(board);
}

function setRandomMinesOnBoard(board) {
    var randomNumbers = getArrOfRandomNumbers();

    for (var i = 0; i < randomNumbers.length; i++) {
        var number = randomNumbers[i];
        var col = (number % gCurrLevel.SIZE) - 1;
        if (col === -1) col = gCurrLevel.SIZE - 1;
        var row = Math.floor(number / gCurrLevel.SIZE);

        if (row !== 0 && number % gCurrLevel.SIZE === 0) row = row - 1;
        board[row][col] = {
            minesAroundCount: 0,
            isShown: false,
            isMine: true,
            isMarked: false
        };
    }
    return board;
}

function getArrOfRandomNumbers() {
    var indexes = [];
    var numberOfMines = gCurrLevel.MINES;
    while (numberOfMines > 0) {
        var randomNum = getRandomIntInclusive(1, gCurrLevel.SIZE * gCurrLevel.SIZE);

        if (!indexes.includes(randomNum)) {
            indexes.push(randomNum);
            numberOfMines--;
        }
    }
    return indexes;
}

function rightMouseClicked(event, posI, posJ) {
    event.preventDefault()
    if (!gGame.isOn) return;
    var currCell = gBoard[posI][posJ];
    if (currCell.isShown === true) return;
    currCell.isMarked = !currCell.isMarked;
    if (currCell.isMarked) {
        flagsCounter--
    } else {
        flagsCounter++
    }

    gelFlagsCounter.innerText = flagsCounter;
    renderBoard();
}

function leftMouseClicked(posI, posJ) {
    if (!gGame.isOn) return;

    var currCell = gBoard[posI][posJ];

    if (currCell.isMine && gFirstClick || currCell.minesAroundCount > 0 && gFirstClick) {
        deleteAllMinesOnBoard(gBoard);
        setRandomMinesOnBoard(gBoard);
        renderBoard(gBoard)
        leftMouseClicked(posI, posJ);
    }
    if (gFirstClick) gTimerInterval = setInterval(timer, 1000);
    gFirstClick = false;
    if (currCell.isMarked === true) return;
    if (gISHintClicked) {
        revealNegsHint(posI, posJ);
        gISHintClicked = false;
        setTimeout(function () { hideNegsHint(posI, posJ); }, 1000);
        gHintsNumber--;
        renderHints();
        return;
    }
    if (currCell.minesAroundCount === 0 && currCell.isMine === false) {
        expandShown(posI, posJ);
    }
    else {
        currCell.isShown = true;
    }
    if (currCell.isMine) {
        gameOver();
    }
    renderBoard();
}

function revealNegsHint(posI, posJ) {

    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;

        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (!gBoard[i][j].isShown) {
                gBoard[i][j].isShown = true;
            } else {
                gBoard[i][j].hint = true;
            }

        }
    }
    renderBoard();
}

function hideNegsHint(posI, posJ) {

    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;

        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (gBoard[i][j].isShown) {
                gBoard[i][j].isShown = false;
            }
            if (gBoard[i][j].hint) {
                gBoard[i][j].isShown = true;
            }

        }
    }
    renderBoard();
    gElHintPopup.classList.add('hidden');
}

function expandShown(posI, posJ) {

    if (gBoard[posI][posJ].minesAroundCount > 0 || gBoard[posI][posJ].isShown) {
        return;
    }
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;

        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === posI && j === posJ) continue;

            if (!gBoard[posI][posJ].isMine) gBoard[posI][posJ].isShown = true;
            if (gBoard[posI][posJ].isMarked) gBoard[posI][posJ].isShown = false;

            if (gBoard[i][j].minesAroundCount === 0) {
                expandShown(i, j);
            } else {
                gBoard[i][j].isShown = true;
            }

        }
    }
    renderBoard();
}

function isWon() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];

            if (!currCell.isMine && !currCell.isShown || currCell.isMine && !currCell.isMarked) {
                return false;
            }
        }

    }
    return true;
}

function gameOver() {
    clearInterval(gTimerInterval);
    revealAllMines();
    gHintsNumber = 3;
    gGame.isOn = false;
    gFirstClick = true;
    gElRstartButton.innerText = DEATH;
}

function victorious() {
    clearInterval(gTimerInterval);
    gHintsNumber = 3;
    gGame.isOn = false;
    gFirstClick = true;
    gElRstartButton.innerText = WIN;
    setBestScore();
}

function deleteAllMinesOnBoard(gBoard) {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j];
            currCell.isMine = false;

        }

    }
}

function renderHints() {
    var elHints = document.querySelector('.hints');
    var strHTML = '';
    for (var i = 0; i < gHintsNumber; i++) {
        var classname = `hint${i + 1} `;
        strHTML += `<span class="${classname}" onclick="hintClicked()">${HINT}</span>\n`
    }
    elHints.innerHTML = strHTML;
}

function hintClicked() {
    gISHintClicked = true;
    gElHintPopup.innerText = 'Now you can safely click on one cube on the board, and discover its neighbors!'
    gElHintPopup.classList.remove('hidden');
}