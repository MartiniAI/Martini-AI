import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

declare var Howl: any;

const sounds = {
  click: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b2c14a277.mp3'], volume: 0.7 }),
  bet: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2021/08/09/audio_59a242f34e.mp3'], volume: 0.7 }),
  shake: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2021/08/04/audio_16cc69f893.mp3'] }),
  win: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3b092e85a.mp3'] }),
  lose: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2022/03/10/audio_c6f2293f77.mp3'] }),
  flip: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2022/03/15/audio_131165f17d.mp3'], volume: 0.6 }),
  match: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2022/11/17/audio_8415a7721d.mp3'] }),
  gameWin: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2022/01/18/audio_1380845a72.mp3'] }),
  error: new Howl({ src: ['https://cdn.pixabay.com/download/audio/2022/03/10/audio_51c72a71a0.mp3'] }),
};

type SoundName = keyof typeof sounds;

interface SoundProps {
  playSound: (name: SoundName) => void;
}

const BAU_CUA_ITEMS = [
  { id: 'nai', name: 'Nai', emoji: '🦌' },
  { id: 'bau', name: 'Bầu', emoji: '🎃' },
  { id: 'ga', name: 'Gà', emoji: '🐓' },
  { id: 'ca', name: 'Cá', emoji: '🐟' },
  { id: 'cua', name: 'Cua', emoji: '🦀' },
  { id: 'tom', name: 'Tôm', emoji: '🦐' },
];

const BET_AMOUNT = 10;

interface GameProps extends SoundProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

const BauCuaGame: React.FC<GameProps> = ({ balance, setBalance, playSound }) => {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [results, setResults] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [message, setMessage] = useState('Đặt cược và nhấn Lắc!');

  const totalBet = useMemo(() => Object.values(bets).reduce((sum: number, current: number) => sum + current, 0), [bets]);
  
  const placeBet = (itemId: string) => {
    if (isShaking) return;
    if (balance < BET_AMOUNT) {
      setMessage("Không đủ tiền để cược!");
      return;
    }
    playSound('bet');
    setBalance(prev => prev - BET_AMOUNT);
    setBets(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + BET_AMOUNT }));
  };

  const clearBets = () => {
    if (isShaking) return;
    playSound('click');
    setBalance(prev => prev + totalBet);
    setBets({});
  };

  const handleShake = () => {
    if (totalBet === 0 || isShaking) return;

    playSound('shake');
    setIsShaking(true);
    setResults([]);
    setMessage('Đang lắc...');

    setTimeout(() => {
      const roll1 = BAU_CUA_ITEMS[Math.floor(Math.random() * BAU_CUA_ITEMS.length)].id;
      const roll2 = BAU_CUA_ITEMS[Math.floor(Math.random() * BAU_CUA_ITEMS.length)].id;
      const roll3 = BAU_CUA_ITEMS[Math.floor(Math.random() * BAU_CUA_ITEMS.length)].id;
      const newResults = [roll1, roll2, roll3];
      setResults(newResults);
      
      let payout = 0;
      for (const [itemId, betAmount] of Object.entries(bets)) {
          const appearances = newResults.filter(res => res === itemId).length;
          if (appearances > 0) {
              payout += betAmount + (betAmount * appearances);
          }
      }

      const netChange = payout - totalBet;
      setBalance((prev: number) => prev + payout);
      
      if (netChange > 0) {
        setMessage(`Thắng ${netChange}!`);
        playSound('win');
      } else if (netChange < 0) {
        setMessage(`Thua ${-netChange}.`);
        playSound('lose');
      } else {
        setMessage('Hòa vốn!');
      }

      setBets({});
      setIsShaking(false);
    }, 1000);
  };
  
  return (
    <div className="game-container">
      <h2 className="game-title">Bầu Cua Tôm Cá</h2>
      <div className="stats-bar">
        <div className="balance" aria-label="Current Balance">Số dư: {balance}</div>
        <div className="total-bet" aria-label="Total Bet">Tổng cược: {totalBet}</div>
      </div>
      <div className="betting-board" role="grid">
        {BAU_CUA_ITEMS.map(item => (
          <div 
            key={item.id} 
            className={`bet-item ${bets[item.id] > 0 ? 'selected' : ''}`}
            onClick={() => placeBet(item.id)}
            role="gridcell"
            tabIndex={0}
            aria-label={`Bet on ${item.name}`}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && placeBet(item.id)}
          >
            <div className="item-emoji" aria-hidden="true">{item.emoji}</div>
            <div className="item-name">{item.name}</div>
            <div className="bet-amount">{bets[item.id] > 0 ? bets[item.id] : ''}</div>
          </div>
        ))}
      </div>
       <div className="controls">
        <button onClick={handleShake} className="btn btn-primary" disabled={isShaking || totalBet === 0}>Lắc</button>
        <button onClick={clearBets} className="btn btn-secondary" disabled={isShaking || totalBet === 0}>Xóa cược</button>
      </div>
      <div className="results-container">
        <div className={`bowl ${isShaking ? 'shaking' : ''}`} aria-hidden="true">🥣</div>
        <div className="results-display" aria-live="polite">
          {results.map((res, index) => (
            <div key={index} className="result-item" aria-label={`Result ${index+1}: ${res}`}>
              {BAU_CUA_ITEMS.find(item => item.id === res)?.emoji}
            </div>
          ))}
        </div>
        <div className={`status-message ${message.includes('Thắng') ? 'win' : message.includes('Thua') ? 'lose' : ''}`}>{message}</div>
      </div>
    </div>
  );
};

const SvgDice = ({ dots }: { dots: number }) => {
    const dotPositions: { [key: number]: number[][] } = {
        1: [[50, 50]],
        2: [[30, 70], [70, 30]],
        3: [[30, 70], [50, 50], [70, 30]],
        4: [[30, 30], [70, 30], [30, 70], [70, 70]],
        5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
        6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]],
    };

    return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <defs>
                <filter id="dice-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
                    <feOffset dx="2" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.5" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <rect x="5" y="5" width="90" height="90" rx="15" fill="#f7f7f7" stroke="#666" strokeWidth="2" style={{ filter: 'url(#dice-shadow)' }} />
            {dotPositions[dots] && dotPositions[dots].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="8" fill="#111" />
            ))}
        </svg>
    );
};

interface DiceItem {
  id: string;
  name: string;
  emoji: React.ReactNode;
}

const DICE_ITEMS: DiceItem[] = [
  { id: '1', name: 'Một', emoji: <SvgDice dots={1} /> },
  { id: '2', name: 'Hai', emoji: <SvgDice dots={2} /> },
  { id: '3', name: 'Ba', emoji: <SvgDice dots={3} /> },
  { id: '4', name: 'Bốn', emoji: <SvgDice dots={4} /> },
  { id: '5', name: 'Năm', emoji: <SvgDice dots={5} /> },
  { id: '6', name: 'Sáu', emoji: <SvgDice dots={6} /> },
];

const DiceRoller: React.FC<GameProps> = ({ balance, setBalance, playSound }) => {
    const [bets, setBets] = useState<Record<string, number>>({});
    const [result, setResult] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [message, setMessage] = useState('Chọn một mặt và nhấn Đổ!');

    const totalBet = useMemo(() => Object.values(bets).reduce((sum, current) => sum + current, 0), [bets]);

    const placeBet = (itemId: string) => {
        if (isRolling) return;
        if (balance < BET_AMOUNT) {
          setMessage("Không đủ tiền để cược!");
          return;
        }
        playSound('bet');
        setBalance(prev => prev - BET_AMOUNT);
        setBets(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + BET_AMOUNT }));
    };

    const clearBets = () => {
        if (isRolling) return;
        playSound('click');
        setBalance(prev => prev + totalBet);
        setBets({});
    };

    const handleRoll = () => {
        if (totalBet === 0 || isRolling) return;

        playSound('shake');
        setIsRolling(true);
        setResult(null);
        setMessage('Đang đổ...');

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            
            const winningFace = roll.toString();
            let payout = 0;
            if (bets[winningFace]) {
                payout = bets[winningFace] + (bets[winningFace] * 5); 
            }
            
            const netChange = payout - totalBet;
            setBalance((prev: number) => prev + payout);
            
            if (netChange > 0) {
                setMessage(`Thắng ${netChange}!`);
                playSound('win');
            } else if (netChange < 0) {
                setMessage(`Thua ${-netChange}. Chúc may mắn lần sau!`);
                playSound('lose');
            } else {
                setMessage('Bạn không cược nên không có gì thay đổi.');
            }

            setBets({});
            setIsRolling(false);
            setResult(roll);
        }, 1000);
    };

    return (
        <div className="game-container">
            <h2 className="game-title">Đổ Xí Ngầu</h2>
            <div className="stats-bar">
                <div className="balance" aria-label="Current Balance">Số dư: {balance}</div>
                <div className="total-bet" aria-label="Total Bet">Tổng cược: {totalBet}</div>
            </div>
            <div className="betting-board" role="grid">
                {DICE_ITEMS.map(item => (
                    <div 
                        key={item.id} 
                        className={`bet-item ${bets[item.id] > 0 ? 'selected' : ''}`}
                        onClick={() => placeBet(item.id)}
                        role="gridcell"
                        tabIndex={0}
                        aria-label={`Bet on face ${item.name}`}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && placeBet(item.id)}
                    >
                        <div className="item-emoji" aria-hidden="true">{item.emoji}</div>
                        <div className="item-name">{item.name}</div>
                        <div className="bet-amount">{bets[item.id] > 0 ? bets[item.id] : ''}</div>
                    </div>
                ))}
            </div>
            <div className="controls">
                <button onClick={handleRoll} className="btn btn-primary" disabled={isRolling || totalBet === 0}>
                    {isRolling ? 'Đang đổ...' : 'Đổ Xí Ngầu'}
                </button>
                <button onClick={clearBets} className="btn btn-secondary" disabled={isRolling || totalBet === 0}>Xóa cược</button>
            </div>

            <div className="dice-results-container" aria-live="polite">
                {isRolling && <div className={`die shaking`} aria-hidden="true"><SvgDice dots={Math.floor(Math.random() * 6) + 1}/></div>}
                {result !== null && !isRolling && (
                    <div className="die" aria-label={`Result: ${result}`}>
                        {DICE_ITEMS[result - 1].emoji}
                    </div>
                )}
            </div>
            <div className={`status-message ${message.includes('Thắng') ? 'win' : message.includes('Thua') ? 'lose' : ''}`}>{message}</div>
        </div>
    );
};


type Difficulty = 'easy' | 'medium' | 'expert';
type Board = (number | null)[][];
type ValidationBoard = ('correct' | 'incorrect' | 'empty')[][];

const SUDOKU_DIFFICULTY_LEVELS: Record<Difficulty, { name: string; cellsToRemove: number }> = {
    easy: { name: 'Đơn giản', cellsToRemove: 40 },
    medium: { name: 'Trung bình', cellsToRemove: 50 },
    expert: { name: 'Chuyên gia', cellsToRemove: 60 },
};

const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const isValid = (board: Board, row: number, col: number, num: number) => {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num || board[i][col] === num) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[startRow + i][startCol + j] === num) return false;
        }
    }
    return true;
};

const solveSudoku = (board: Board): boolean => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === null) {
                const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of numbers) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) {
                            return true;
                        }
                        board[row][col] = null;
                    }
                }
                return false;
            }
        }
    }
    return true;
};

const generateSudoku = (difficulty: Difficulty) => {
    const solution: Board = Array(9).fill(null).map(() => Array(9).fill(null));
    solveSudoku(solution);
    
    const puzzle = JSON.parse(JSON.stringify(solution));
    let removed = 0;
    while (removed < SUDOKU_DIFFICULTY_LEVELS[difficulty].cellsToRemove) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        if (puzzle[row][col] !== null) {
            puzzle[row][col] = null;
            removed++;
        }
    }
    return { puzzle, solution };
};

const SudokuGame: React.FC<SoundProps> = ({ playSound }) => {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [initialBoard, setInitialBoard] = useState<Board | null>(null);
    const [solutionBoard, setSolutionBoard] = useState<Board | null>(null);
    const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [validation, setValidation] = useState<ValidationBoard | null>(null);
    const [message, setMessage] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const savedGame = localStorage.getItem('sudokuGameState');
            if (savedGame) {
                const { savedDifficulty, savedInitialBoard, savedSolutionBoard, savedCurrentBoard } = JSON.parse(savedGame);
                if (savedDifficulty && savedInitialBoard && savedSolutionBoard && savedCurrentBoard) {
                    setDifficulty(savedDifficulty);
                    setInitialBoard(savedInitialBoard);
                    setSolutionBoard(savedSolutionBoard);
                    setCurrentBoard(savedCurrentBoard);
                }
            }
        } catch (error) {
            console.error("Failed to load Sudoku game state:", error);
            localStorage.removeItem('sudokuGameState');
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded && difficulty && currentBoard) {
            try {
                const gameState = {
                    savedDifficulty: difficulty,
                    savedInitialBoard: initialBoard,
                    savedSolutionBoard: solutionBoard,
                    savedCurrentBoard: currentBoard,
                };
                localStorage.setItem('sudokuGameState', JSON.stringify(gameState));
            } catch (error) {
                console.error("Failed to save Sudoku game state:", error);
            }
        }
    }, [currentBoard, difficulty, initialBoard, solutionBoard, isLoaded]);

    const startGame = useCallback((level: Difficulty) => {
        playSound('click');
        const { puzzle, solution } = generateSudoku(level);
        setDifficulty(level);
        setInitialBoard(puzzle);
        setSolutionBoard(solution);
        setCurrentBoard(JSON.parse(JSON.stringify(puzzle)));
        setSelectedCell(null);
        setValidation(null);
        setMessage('');
    }, [playSound]);

    const handleCellClick = (row: number, col: number) => {
        if (initialBoard && initialBoard[row][col] === null) {
            setSelectedCell({ row, col });
        }
    };
    
    const handleNumberInput = (num: number) => {
        if (selectedCell && currentBoard) {
            playSound('click');
            const newBoard = JSON.parse(JSON.stringify(currentBoard));
            newBoard[selectedCell.row][selectedCell.col] = num;
            setCurrentBoard(newBoard);
            setValidation(null);
        }
    };

    const handleErase = () => {
        if (selectedCell && currentBoard) {
            playSound('click');
            const newBoard = JSON.parse(JSON.stringify(currentBoard));
            newBoard[selectedCell.row][selectedCell.col] = null;
            setCurrentBoard(newBoard);
            setValidation(null);
        }
    };
    
    const handleCheck = () => {
        playSound('click');
        if (!currentBoard || !solutionBoard) return;
        const newValidation: ValidationBoard = Array(9).fill(null).map(() => Array(9).fill('empty'));
        let isComplete = true;
        let hasErrors = false;
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (currentBoard[r][c] !== null) {
                    if (currentBoard[r][c] === solutionBoard[r][c]) {
                        newValidation[r][c] = 'correct';
                    } else {
                        newValidation[r][c] = 'incorrect';
                        hasErrors = true;
                    }
                } else {
                    isComplete = false;
                }
            }
        }
        setValidation(newValidation);
        if (!hasErrors && isComplete) {
            setMessage('Chúc mừng! Bạn đã giải đúng!');
            playSound('gameWin');
        } else if (hasErrors) {
            setMessage('Có lỗi sai, hãy kiểm tra lại!');
            playSound('error');
        } else {
            setMessage('Các số đã điền đều đúng, tiếp tục nào!');
            playSound('match');
        }
    };
    
    const handleSolve = () => {
        playSound('click');
        setCurrentBoard(solutionBoard);
        setValidation(null);
        setMessage('Bảng đã được giải.');
    };

    const handleDifficultyChange = () => {
        playSound('click');
        localStorage.removeItem('sudokuGameState');
        setDifficulty(null);
        setInitialBoard(null);
        setSolutionBoard(null);
        setCurrentBoard(null);
        setSelectedCell(null);
        setValidation(null);
        setMessage('');
    }

    if (!difficulty || !currentBoard) {
        return (
            <div className="game-container sudoku-game">
                <h2 className="game-title">Sudoku</h2>
                <div className="difficulty-selector">
                    <h3>Chọn cấp độ</h3>
                    {Object.entries(SUDOKU_DIFFICULTY_LEVELS).map(([key, { name }]) => (
                        <button key={key} onClick={() => startGame(key as Difficulty)} className="btn btn-primary">
                            {name}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="game-container sudoku-game">
            <h2 className="game-title">Sudoku - {SUDOKU_DIFFICULTY_LEVELS[difficulty].name}</h2>
            <div className="sudoku-board">
                {currentBoard.map((row, r) =>
                    row.map((cell, c) => {
                        const isPrefilled = initialBoard && initialBoard[r][c] !== null;
                        const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                        const isHighlighted = selectedCell && (selectedCell.row === r || selectedCell.col === c || (Math.floor(selectedCell.row / 3) === Math.floor(r / 3) && Math.floor(selectedCell.col / 3) === Math.floor(c / 3)));
                        const validationStatus = validation?.[r][c];

                        const cellClasses = [
                            'sudoku-cell',
                            isPrefilled ? 'prefilled' : '',
                            isSelected ? 'selected' : '',
                            isHighlighted ? 'highlighted' : '',
                            validationStatus === 'correct' ? 'correct' : '',
                            validationStatus === 'incorrect' ? 'incorrect' : ''
                        ].join(' ');

                        return (
                            <div key={`${r}-${c}`} className={cellClasses} onClick={() => handleCellClick(r, c)} tabIndex={isPrefilled ? -1 : 0}>
                                {cell}
                            </div>
                        );
                    })
                )}
            </div>
            <div className="number-pad">
                {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
                    <button key={num} onClick={() => handleNumberInput(num)} className="btn">{num}</button>
                ))}
                 <button onClick={handleErase} className="btn btn-secondary">Xóa</button>
            </div>
            <div className="controls sudoku-controls">
                <button onClick={handleCheck} className="btn btn-primary">Kiểm tra</button>
                <button onClick={handleSolve} className="btn btn-secondary">Giải bài</button>
                <button onClick={() => startGame(difficulty)} className="btn btn-secondary">Chơi lại</button>
                <button onClick={handleDifficultyChange} className="btn btn-secondary">Đổi cấp độ</button>
            </div>
            <div className={`status-message ${message.includes('Chúc mừng') ? 'win' : message.includes('lỗi') ? 'lose' : ''}`}>{message}</div>
        </div>
    );
};

const MONSTERS = ['👾', '👹', '👻', '👽', '💀', '🎃', '🤡', '😈', '🤖', '👺'];
type MemoryDifficulty = 'easy' | 'medium' | 'expert';

const MEMORY_DIFFICULTY_LEVELS: Record<MemoryDifficulty, { name: string; size: number; rows: number, cols: number }> = {
    easy: { name: 'Đơn giản', size: 6, rows: 3, cols: 4 },
    medium: { name: 'Trung bình', size: 8, rows: 4, cols: 4 },
    expert: { name: 'Chuyên gia', size: 10, rows: 4, cols: 5 },
};

interface Card {
  id: number;
  type: string;
}

const MemoryGame: React.FC<SoundProps> = ({ playSound }) => {
    const [difficulty, setDifficulty] = useState<MemoryDifficulty | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [moves, setMoves] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [highScores, setHighScores] = useState<Record<MemoryDifficulty, number | null>>({ easy: null, medium: null, expert: null });
    const [isNewHighScore, setIsNewHighScore] = useState(false);

    useEffect(() => {
        try {
            const savedScores = localStorage.getItem('memoryHighScores');
            if (savedScores) {
                const parsedScores = JSON.parse(savedScores);
                setHighScores(prev => ({ ...prev, ...parsedScores }));
            }
        } catch (error) {
            console.error("Failed to load memory high scores:", error);
            localStorage.removeItem('memoryHighScores');
        }
    }, []);

    const startGame = useCallback((level: MemoryDifficulty) => {
        playSound('click');
        const { size } = MEMORY_DIFFICULTY_LEVELS[level];
        const monsterSet = MONSTERS.slice(0, size);
        const duplicatedMonsters = [...monsterSet, ...monsterSet];
        const shuffledCards = shuffle(duplicatedMonsters).map((type, index) => ({ id: index, type }));
        
        setDifficulty(level);
        setCards(shuffledCards);
        setFlippedCards([]);
        setMatchedPairs([]);
        setMoves(0);
        setIsNewHighScore(false);
    }, [playSound]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedCards.includes(index) || matchedPairs.includes(cards[index].type)) {
            return;
        }
        playSound('flip');

        const newFlippedCards = [...flippedCards, index];
        setFlippedCards(newFlippedCards);
        
        if (newFlippedCards.length === 2) {
            setMoves(m => m + 1);
            setIsChecking(true);
            const [firstIndex, secondIndex] = newFlippedCards;
            if (cards[firstIndex].type === cards[secondIndex].type) {
                setMatchedPairs(prev => [...prev, cards[firstIndex].type]);
                setFlippedCards([]);
                setIsChecking(false);
                playSound('match');
            } else {
                setTimeout(() => {
                    setFlippedCards([]);
                    setIsChecking(false);
                }, 1000);
            }
        }
    };

    const handleDifficultyChange = () => {
        playSound('click');
        setDifficulty(null);
    }
    
    const isGameWon = difficulty && matchedPairs.length === MEMORY_DIFFICULTY_LEVELS[difficulty].size;
    
    useEffect(() => {
        if (isGameWon) {
            playSound('gameWin');
            const currentBest = highScores[difficulty!];
            if (currentBest === null || moves < currentBest) {
                setIsNewHighScore(true);
                const newHighScores = { ...highScores, [difficulty!]: moves };
                setHighScores(newHighScores);
                try {
                    localStorage.setItem('memoryHighScores', JSON.stringify(newHighScores));
                } catch (error) {
                    console.error("Failed to save high scores:", error);
                }
            }
        }
    }, [isGameWon, playSound, difficulty, moves, highScores]);

    if (!difficulty) {
         return (
            <div className="game-container memory-game">
                <h2 className="game-title">Thử Thách Trí Nhớ</h2>
                <div className="difficulty-selector">
                    <h3>Chọn cấp độ</h3>
                    {Object.entries(MEMORY_DIFFICULTY_LEVELS).map(([key, { name }]) => (
                        <button key={key} onClick={() => startGame(key as MemoryDifficulty)} className="btn btn-primary">
                            <span>{name}</span>
                            {highScores[key as MemoryDifficulty] !== null ? (
                                <span className="high-score-display">Kỷ lục: {highScores[key as MemoryDifficulty]} lần</span>
                            ) : (
                                <span className="high-score-display">Chưa có kỷ lục</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    
    const { rows, cols } = MEMORY_DIFFICULTY_LEVELS[difficulty];
    const gridStyle = { gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` };

    return (
        <div className="game-container memory-game">
            <h2 className="game-title">Thử Thách Trí Nhớ - {MEMORY_DIFFICULTY_LEVELS[difficulty].name}</h2>
            <div className="stats-bar">
                <span>Số lần lật: {moves}</span>
            </div>
             {isGameWon ? (
                <div className="win-screen">
                    <h3>Chúc mừng! Bạn đã thắng!</h3>
                    {isNewHighScore && <p className="new-high-score">Kỷ lục mới!</p>}
                    <p>Bạn đã hoàn thành trong {moves} lần lật.</p>
                    <div className="controls">
                      <button onClick={() => startGame(difficulty)} className="btn btn-primary">Chơi lại</button>
                      <button onClick={handleDifficultyChange} className="btn btn-secondary">Đổi cấp độ</button>
                    </div>
                </div>
            ) : (
                <>
                <div className="memory-board" style={gridStyle}>
                    {cards.map((card, index) => {
                        const isFlipped = flippedCards.includes(index) || matchedPairs.includes(card.type);
                        return (
                            <div key={index} className={`memory-card-container`} onClick={() => handleCardClick(index)}>
                                <div className={`memory-card ${isFlipped ? 'flipped' : ''}`}>
                                    <div className="card-face card-back">?</div>
                                    <div className="card-face card-front">{card.type}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="controls">
                    <button onClick={handleDifficultyChange} className="btn btn-secondary">Đổi cấp độ</button>
                </div>
                </>
             )}
        </div>
    );
};

const lunarConverter = {
    lunarData: [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
        0x04970, 0x0a4b2, 0x0a9d0, 0x0b250, 0x0c955, 0x0b5a0, 0x0b6d0, 0x06dd4, 0x02b60, 0x0a9b8,
        0x0a950, 0x0b4a0, 0x0b5a6, 0x06d40, 0x055b0, 0x14575, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950,
        0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950,
        0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57,
        0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0,
        0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60,
        0x09570, 0x04970, 0x0a4b2, 0x0a9d0, 0x0b250, 0x0c955, 0x0b5a0, 0x0b6d0, 0x06dd4, 0x02b60,
        0x0a9b8, 0x0a950, 0x0b4a0, 0x0b5a6, 0x06d40, 0x055b0, 0x14575, 0x025d0, 0x092d0, 0x0d2b2,
        0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8,
        0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950,
        0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540,
        0x0b6a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46
    ],

    getLeapMonth: (year: number) => {
        return lunarConverter.lunarData[year - 1900] & 0xf;
    },

    getLeapMonthDays: (year: number) => {
        if (lunarConverter.getLeapMonth(year) !== 0) {
            return (lunarConverter.lunarData[year - 1900] & 0x10000) ? 30 : 29;
        }
        return 0;
    },
    
    getLunarMonthDays: (year: number, month: number) => {
        const data = lunarConverter.lunarData[year - 1900] & (0x8000 >> (month - 1));
        return data ? 30 : 29;
    },
    
    getLunarYearDays: (year: number) => {
        let i, sum = 348;
        for (i = 0x8000; i > 0x8; i >>= 1) {
            sum += (lunarConverter.lunarData[year - 1900] & i) ? 1 : 0;
        }
        return sum + lunarConverter.getLeapMonthDays(year);
    },

    jdFromDate: (dd: number, mm: number, yy: number) => {
        const a = Math.floor((14 - mm) / 12);
        const y = yy + 4800 - a;
        const m = mm + 12 * a - 3;
        return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    },

    convertSolarToLunar: (dd: number, mm: number, yy: number) => {
        const CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
        const CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];

        // Start of the lunar calendar data (Jan 31, 1900)
        const solarEpoch = new Date(1900, 0, 31, 12, 0, 0); // Use noon to avoid timezone issues
        const solarDate = new Date(yy, mm - 1, dd, 12, 0, 0);
        let offset = Math.floor((solarDate.getTime() - solarEpoch.getTime()) / 86400000);

        let lunarYear, lunarMonth, lunarDay;
        let isLeap = false;
        
        for (lunarYear = 1900; lunarYear < 2101 && offset >= 0; lunarYear++) {
            const daysInYear = lunarConverter.getLunarYearDays(lunarYear);
            if (offset < daysInYear) {
                break;
            }
            offset -= daysInYear;
        }

        const leapMonth = lunarConverter.getLeapMonth(lunarYear);

        for (lunarMonth = 1; lunarMonth <= 12; lunarMonth++) {
            // Check regular month first
            const daysInMonth = lunarConverter.getLunarMonthDays(lunarYear, lunarMonth);
            if (offset < daysInMonth) {
                isLeap = false;
                break;
            }
            offset -= daysInMonth;

            // Check if there is a leap month AFTER this regular month
            if (lunarMonth === leapMonth) {
                const daysInLeapMonth = lunarConverter.getLeapMonthDays(lunarYear);
                if (offset < daysInLeapMonth) {
                    isLeap = true;
                    break;
                }
                offset -= daysInLeapMonth;
            }
        }
        
        lunarDay = offset + 1;
        if (isLeap) {
          lunarMonth = leapMonth;
        }

        const jd = lunarConverter.jdFromDate(dd, mm, yy);
        const dayCanChi = `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
        const yearCanChi = `${CAN[lunarYear % 10]} ${CHI[lunarYear % 12]}`;

        return {
            day: lunarDay,
            month: lunarMonth,
            year: lunarYear,
            isLeap,
            dayName: dayCanChi,
            yearName: yearCanChi,
        };
    }
};


const LunarCalendar = () => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [lunarResult, setLunarResult] = useState(null);

    const handleConvert = useCallback(() => {
        const [yy, mm, dd] = date.split('-').map(Number);
        const result = lunarConverter.convertSolarToLunar(dd, mm, yy);
        setLunarResult(result);
    }, [date]);
    
    useEffect(() => {
        handleConvert();
    }, [handleConvert]);

    return (
        <div className="tool-container">
            <h2 className="game-title">Đổi Lịch Âm - Dương</h2>
            <div className="form-group">
                <label htmlFor="solar-date">Chọn ngày dương lịch:</label>
                <input type="date" id="solar-date" value={date} onChange={(e) => setDate(e.target.value)} />
                 <button onClick={handleConvert} className="btn btn-primary">Chuyển đổi</button>
            </div>

            {lunarResult && (
                <div className="result-card" aria-live="polite">
                    <h3>Kết quả</h3>
                    <p><strong>Ngày Dương Lịch:</strong> {new Date(date + 'T00:00:00').toLocaleDateString('vi-VN')}</p>
                    <p><strong>Ngày Âm Lịch:</strong> {lunarResult.day}/{lunarResult.month}/{lunarResult.year} {lunarResult.isLeap ? '(Nhuận)' : ''}</p>
                    <p><strong>Ngày (Can Chi):</strong> {lunarResult.dayName}</p>
                    <p><strong>Năm (Can Chi):</strong> {lunarResult.yearName}</p>
                </div>
            )}
        </div>
    );
};

const CITIES = [
    { name: 'Hanoi', image: 'https://lp-cms-production.imgix.net/2023-11/shutterstock_1549547057.jpg?auto=format&w=1440&h=810&fit=crop&q=75' },
    { name: 'Ho Chi Minh City', image: 'https://images.adsttc.com/media/images/5d34/a5a8/284d/d10a/2f00/0037/large_jpg/190708_-_%E6%B8%9D%E5%AE%9D%E5%BB%9F%E5%AE%A4%E5%85%AC%E5%9C%92-5.jpg?1563731358' },
    { name: 'Da Nang', image: 'https://statics.vinwonders.com/cau-vang-da-nang-banner.jpg' },
    { name: 'Ha Long Bay', image: 'https://images.unsplash.com/photo-1597759231682-16b1b953a1e0?q=80&w=1974&auto=format&fit=crop' },
    { name: 'Hoi An', image: 'https://images.unsplash.com/photo-1526481280643-333fa6652a94?q=80&w=2070&auto=format&fit=crop' },
    { name: 'London', image: 'https://images.unsplash.com/photo-1529655683826-1a33ef0535c1?q=80&w=1974&auto=format&fit=crop' },
    { name: 'Paris', image: 'https://images.unsplash.com/photo-1500313830543-599182981546?q=80&w=1974&auto=format&fit=crop' },
    { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=2072&auto=format&fit=crop' },
    { name: 'New York', image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?q=80&w=2070&auto=format&fit=crop' },
    { name: 'Sydney', image: 'https://images.unsplash.com/photo-1524293581273-795a2718492c?q=80&w=2070&auto=format&fit=crop' },
    { name: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1974&auto=format&fit=crop' },
];

const getMockWeatherData = () => ({
    temp: (Math.random() * 10 + 25).toFixed(1), // 25-35°C
    humidity: (Math.random() * 30 + 60).toFixed(0), // 60-90%
    wind: (Math.random() * 15 + 5).toFixed(1), // 5-20 km/h
    condition: ['Nắng đẹp', 'Nhiều mây', 'Có mưa rào'][Math.floor(Math.random() * 3)],
});

const WeatherForecast = () => {
    const [city, setCity] = useState(CITIES[0].name);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    const [weather, setWeather] = useState(null);

    const currentCityData = useMemo(() => CITIES.find(c => c.name === city) || CITIES[0], [city]);

    useEffect(() => {
        setWeather(getMockWeatherData());
    }, [city]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setWeather(getMockWeatherData());
    };

    return (
        <div className="tool-container">
            <h2 className="game-title">Dự Báo Thời Tiết</h2>
            <form onSubmit={handleSearch} className="form-group weather-form">
                <div className="input-group">
                  <label htmlFor="city-select">Chọn thành phố:</label>
                  <select id="city-select" value={city} onChange={(e) => setCity(e.target.value)}>
                      {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="input-group">
                    <label htmlFor="date-input">Chọn ngày:</label>
                    <input type="date" id="date-input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                
                <div className="input-group">
                    <label htmlFor="time-input">Chọn giờ:</label>
                    <input type="time" id="time-input" value={time} onChange={e => setTime(e.target.value)} />
                </div>

                <button type="submit" className="btn btn-primary">Xem dự báo</button>
            </form>
            
            {weather && currentCityData && (
                <div className="result-card weather-result-card" aria-live="polite">
                    {currentCityData.image && <img src={currentCityData.image} alt={`Hình ảnh của ${currentCityData.name}`} className="city-image" />}
                    <div className="weather-content">
                        <h3>Thời tiết tại {city}</h3>
                        <p className="weather-datetime">{new Date(date + 'T00:00:00').toLocaleDateString('vi-VN')} lúc {time}</p>
                        <p><strong>Nhiệt độ:</strong> {weather.temp}°C</p>
                        <p><strong>Tình trạng:</strong> {weather.condition}</p>
                        <p><strong>Độ ẩm:</strong> {weather.humidity}%</p>
                        <p><strong>Gió:</strong> {weather.wind} km/h</p>
                        <div className="external-links">
                            <p>Xem dự báo chi tiết tại:</p>
                            <a href={`https://www.accuweather.com/en/search-locations?query=${encodeURIComponent(city)}`} target="_blank" rel="noopener noreferrer">AccuWeather</a>
                            <a href={`https://weather.com/weather/today/l/${encodeURIComponent(city)}`} target="_blank" rel="noopener noreferrer">The Weather Channel</a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ExchangeRates = () => {
    // Hardcoded rates for demonstration. Base is USD.
    const rates: Record<string, number> = {
        'USD': 1,
        'VND': 25458,
        'EUR': 0.93, // Euro
        'JPY': 157.10, // Japanese Yen
        'GBP': 0.79, // British Pound
        'AUD': 1.50, // Australian Dollar
    };
    const currencySymbols: Record<string, string> = {
        'USD': '$',
        'VND': '₫',
        'EUR': '€',
        'JPY': '¥',
        'GBP': '£',
        'AUD': 'A$',
    };

    const [amount, setAmount] = useState<number | string>(1);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('VND');
    const [result, setResult] = useState('');

    useEffect(() => {
        if (amount === '' || isNaN(Number(amount))) {
            setResult('');
            return;
        }

        const numAmount = Number(amount);
        const amountInUsd = numAmount / rates[fromCurrency];
        const convertedAmount = amountInUsd * rates[toCurrency];

        const formattedResult = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2,
        }).format(convertedAmount);
        
        setResult(`${formattedResult} ${currencySymbols[toCurrency] || toCurrency}`);

    }, [amount, fromCurrency, toCurrency]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
            setAmount(value);
        }
    };
    
    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    return (
        <div className="tool-container">
            <h2 className="game-title">Giá Vàng & Tỷ Giá</h2>
            
            <div className="converter-card">
                 <h3>Chuyển đổi tiền tệ</h3>
                <div className="converter-form">
                    <div className="converter-group">
                        <label htmlFor="amount">Số tiền</label>
                        <input 
                            type="number" 
                            id="amount" 
                            value={amount} 
                            onChange={handleAmountChange}
                            min="0"
                        />
                    </div>
                     <div className="converter-group">
                        <label htmlFor="from-currency">Từ</label>
                        <select id="from-currency" value={fromCurrency} onChange={e => setFromCurrency(e.target.value)}>
                            {Object.keys(rates).map(curr => <option key={curr} value={curr}>{curr}</option>)}
                        </select>
                    </div>
                    <div className="swap-button-container">
                        <button onClick={handleSwap} className="btn-swap" aria-label="Hoán đổi tiền tệ">
                           &#8646;
                        </button>
                    </div>
                    <div className="converter-group">
                        <label htmlFor="to-currency">Sang</label>
                        <select id="to-currency" value={toCurrency} onChange={e => setToCurrency(e.target.value)}>
                           {Object.keys(rates).map(curr => <option key={curr} value={curr}>{curr}</option>)}
                        </select>
                    </div>
                </div>
                {result && (
                    <div className="converter-result">
                        <p>{amount} {fromCurrency} =</p>
                        <h2>{result}</h2>
                    </div>
                )}
            </div>

            <div className="result-card">
                 <p className="disclaimer">Dữ liệu chỉ mang tính chất tham khảo tại thời điểm hiển thị.</p>
                <div className="rate-item">
                    <h4>Giá Vàng Quốc Tế</h4>
                    <p className="price">$2,320.50 USD / ounce</p>
                </div>
                <div className="rate-item">
                    <h4>Giá Vàng SJC (Việt Nam)</h4>
                    <p className="price">90,500,000 VNĐ / lượng</p>
                    <small>(1 lượng = 1.20565 ounces)</small>
                </div>
                <div className="external-links">
                    <p>Xem tỷ giá trực tuyến:</p>
                    <a href="https://www.kitco.com/charts/livegold.html" target="_blank" rel="noopener noreferrer">Kitco Gold</a>
                    <a href="https://portal.vietcombank.com.vn/Personal/TG/Pages/ty-gia.aspx" target="_blank" rel="noopener noreferrer">Vietcombank</a>
                </div>
            </div>
        </div>
    );
};

const formatNumber = (num, precision = 4) => {
    return parseFloat(num.toFixed(precision));
};

const QuadraticSolver = () => {
    const [coeffs, setCoeffs] = useState({ a: '', b: '', c: '' });
    const [solution, setSolution] = useState(null);

    const handleSolve = () => {
        const a = parseFloat(coeffs.a) || 0;
        const b = parseFloat(coeffs.b) || 0;
        const c = parseFloat(coeffs.c) || 0;

        if (a === 0) {
            if (b === 0) {
                setSolution({
                    equation: `${c} = 0`,
                    deltaAnalysis: c === 0 ? "Phương trình vô số nghiệm." : "Phương trình vô nghiệm." ,
                    roots: []
                });
            } else {
                 setSolution({
                    equation: `${b}x + ${c} = 0`,
                    deltaAnalysis: "Đây là phương trình bậc nhất.",
                    formula: `x = -c / b = ${-c} / ${b}`,
                    roots: [`x = ${formatNumber(-c/b)}`]
                });
            }
            return;
        }

        const delta = b * b - 4 * a * c;
        let analysis, formula, roots;

        if (delta > 0) {
            const x1 = (-b + Math.sqrt(delta)) / (2 * a);
            const x2 = (-b - Math.sqrt(delta)) / (2 * a);
            analysis = `Δ > 0, phương trình có 2 nghiệm thực phân biệt.`;
            formula = `x1,2 = (-b ± √Δ) / 2a`;
            roots = [`x₁ = ${formatNumber(x1)}`, `x₂ = ${formatNumber(x2)}`];
        } else if (delta === 0) {
            const x = -b / (2 * a);
            analysis = `Δ = 0, phương trình có nghiệm kép.`;
            formula = `x = -b / 2a`;
            roots = [`x₁ = x₂ = ${formatNumber(x)}`];
        } else {
            const realPart = -b / (2 * a);
            const imagPart = Math.sqrt(-delta) / (2 * a);
            analysis = `Δ < 0, phương trình có 2 nghiệm phức.`;
            formula = `x1,2 = (-b ± i√(-Δ)) / 2a`;
            roots = [
                `x₁ = ${formatNumber(realPart)} + ${formatNumber(imagPart)}i`,
                `x₂ = ${formatNumber(realPart)} - ${formatNumber(imagPart)}i`
            ];
        }
        
        setSolution({
            equation: `${a}x² + ${b}x + ${c} = 0`,
            deltaCalc: `Δ = ${b}² - 4 * ${a} * ${c}`,
            deltaValue: delta,
            deltaAnalysis: analysis,
            formula: formula,
            roots: roots
        });
    };

    // FIX: Explicitly type the event parameter `e` to avoid type inference issues.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCoeffs({ ...coeffs, [e.target.name]: e.target.value });
    };

    return (
        <div className="solver-container">
            <h3>Giải phương trình bậc 2: ax² + bx + c = 0</h3>
            <div className="solver-form">
                <div className="input-group"><label>a =</label><input type="number" name="a" value={coeffs.a} onChange={handleChange} /></div>
                <div className="input-group"><label>b =</label><input type="number" name="b" value={coeffs.b} onChange={handleChange} /></div>
                <div className="input-group"><label>c =</label><input type="number" name="c" value={coeffs.c} onChange={handleChange} /></div>
                <button onClick={handleSolve} className="btn btn-primary">Giải</button>
            </div>
            {solution && (
                 <div className="solution-steps">
                    <h4>Phương trình:</h4>
                    <p>{solution.equation}</p>

                    {solution.deltaCalc && <>
                        <h4>1. Tính Delta (Δ)</h4>
                        <p>Δ = b² - 4ac</p>
                        <p>{solution.deltaCalc} = {formatNumber(solution.deltaValue)}</p>
                    </>}

                    <h4>2. Phân tích</h4>
                    <p>{solution.deltaAnalysis}</p>
                    
                    {solution.formula && <>
                      <h4>3. Công thức nghiệm</h4>
                      <p>{solution.formula}</p>
                    </>}

                    <div className="final-result">
                        <strong>Kết quả:</strong>
                        {solution.roots.map((root, i) => <p key={i}>{root}</p>)}
                    </div>
                </div>
            )}
        </div>
    );
};

const CubicSolver = () => {
    // This is a simplified solver for demonstration and might not cover all edge cases perfectly.
    const [coeffs, setCoeffs] = useState({ a: '', b: '', c: '', d: '' });
    const [solution, setSolution] = useState(null);

    const handleSolve = () => {
        let a = parseFloat(coeffs.a) || 0;
        let b = parseFloat(coeffs.b) || 0;
        let c = parseFloat(coeffs.c) || 0;
        let d = parseFloat(coeffs.d) || 0;

        if (a === 0) {
            setSolution({ message: "Hệ số 'a' không thể bằng 0. Đây là phương trình bậc 2 hoặc thấp hơn." });
            return;
        }

        // Normalize to x^3 + ax^2 + bx + c = 0
        b /= a; c /= a; d /= a;

        const p = (3 * c - b * b) / 3;
        const q = (2 * b * b * b - 9 * b * c + 27 * d) / 27;
        const delta = (q / 2) * (q / 2) + (p / 3) * (p / 3) * (p / 3);
        
        const steps = [
            `Phương trình ban đầu: ${coeffs.a}x³ + ${coeffs.b}x² + ${coeffs.c}x + ${coeffs.d} = 0`,
            `Chuẩn hóa (chia cho a): x³ + ${formatNumber(b)}x² + ${formatNumber(c)}x + ${formatNumber(d)} = 0`,
            `Đặt x = t - b/3a để khử số hạng bậc 2, ta được phương trình dạng t³ + pt + q = 0`,
            `p = (3c - b²) / 3 = ${formatNumber(p)}`,
            `q = (2b³ - 9bc + 27d) / 27 = ${formatNumber(q)}`,
            `Tính biệt thức Δ = (q/2)² + (p/3)³ = ${formatNumber(delta)}`
        ];

        let roots = [];
        if (delta >= 0) {
            steps.push("Δ ≥ 0, có 1 nghiệm thực và 2 nghiệm phức (hoặc 3 nghiệm thực nếu Δ=0).");
            const u = Math.cbrt(-q / 2 + Math.sqrt(delta));
            const v = Math.cbrt(-q / 2 - Math.sqrt(delta));
            const x1 = u + v - b / 3;
            const x2_real = -0.5 * (u + v) - b / 3;
            const x2_imag = (Math.sqrt(3) / 2) * (u - v);
            
            roots.push(`x₁ = ${formatNumber(x1)}`);
            if (Math.abs(x2_imag) < 1e-9) { // 3 real roots (2 are same)
                 roots.push(`x₂ = x₃ = ${formatNumber(x2_real)}`);
            } else {
                 roots.push(`x₂ = ${formatNumber(x2_real)} + ${formatNumber(x2_imag)}i`);
                 roots.push(`x₃ = ${formatNumber(x2_real)} - ${formatNumber(x2_imag)}i`);
            }
        } else {
            steps.push("Δ < 0, có 3 nghiệm thực phân biệt (trường hợp lượng giác).");
            const t_k = (k) => 2 * Math.sqrt(-p / 3) * Math.cos((1 / 3) * Math.acos((3 * q / (2 * p)) * Math.sqrt(-3 / p)) - (2 * Math.PI * k / 3));
            const x1 = t_k(0) - b/3;
            const x2 = t_k(1) - b/3;
            const x3 = t_k(2) - b/3;
            roots.push(`x₁ = ${formatNumber(x1)}`);
            roots.push(`x₂ = ${formatNumber(x2)}`);
            roots.push(`x₃ = ${formatNumber(x3)}`);
        }
        
        setSolution({ steps, roots });
    };
    
    // FIX: Explicitly type the event parameter `e` to avoid type inference issues.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCoeffs({ ...coeffs, [e.target.name]: e.target.value });
    };

    return (
        <div className="solver-container">
            <h3>Giải phương trình bậc 3: ax³ + bx² + cx + d = 0</h3>
            <div className="solver-form">
                <div className="input-group"><label>a =</label><input type="number" name="a" value={coeffs.a} onChange={handleChange} /></div>
                <div className="input-group"><label>b =</label><input type="number" name="b" value={coeffs.b} onChange={handleChange} /></div>
                <div className="input-group"><label>c =</label><input type="number" name="c" value={coeffs.c} onChange={handleChange} /></div>
                <div className="input-group"><label>d =</label><input type="number" name="d" value={coeffs.d} onChange={handleChange} /></div>
                <button onClick={handleSolve} className="btn btn-primary">Giải</button>
            </div>
            {solution && (
                 <div className="solution-steps">
                     {solution.message ? <p>{solution.message}</p> : <>
                        <h4>Các bước giải:</h4>
                        {solution.steps.map((step, i) => <p key={i}>{i+1}. {step}</p>)}
                        <div className="final-result">
                            <strong>Kết quả:</strong>
                            {solution.roots.map((root, i) => <p key={i}>{root}</p>)}
                        </div>
                     </>}
                </div>
            )}
        </div>
    );
};

const StatsCalculator = () => {
    const [input, setInput] = useState('');
    // FIX: Explicitly type the `results` state to handle both `string` and `number` values from the calculation, preventing rendering errors.
    const [results, setResults] = useState<Record<string, string | number> | null>(null);

    const handleCalculate = () => {
        const numbers = input.split(/[\s,]+/).filter(Boolean).map(Number).filter(n => !isNaN(n));
        if (numbers.length === 0) {
            setResults(null);
            return;
        }

        numbers.sort((a, b) => a - b);
        const count = numbers.length;
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        const mean = sum / count;
        
        let median;
        const mid = Math.floor(count / 2);
        if (count % 2 === 0) {
            median = (numbers[mid - 1] + numbers[mid]) / 2;
        } else {
            median = numbers[mid];
        }

        // FIX: Explicitly type the accumulator in `reduce` to ensure `counts` has the correct type (`Record<string, number>`), preventing downstream errors with `Object.values`.
        const counts = numbers.reduce((acc: Record<string, number>, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
        const maxFreq = Math.max(...Object.values(counts));
        const mode = Object.keys(counts).filter(key => counts[key] === maxFreq).join(', ');

        const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
        const stdDev = Math.sqrt(variance);

        setResults({
            'Số lượng': count,
            'Tổng': formatNumber(sum),
            'Số nhỏ nhất': numbers[0],
            'Số lớn nhất': numbers[count - 1],
            'Khoảng biến thiên': formatNumber(numbers[count - 1] - numbers[0]),
            'Trung bình cộng (Mean)': formatNumber(mean),
            'Trung vị (Median)': formatNumber(median),
            'Yếu vị (Mode)': mode,
            'Phương sai (Variance)': formatNumber(variance),
            'Độ lệch chuẩn (Std. Dev.)': formatNumber(stdDev),
        });
    };

    return (
        <div className="solver-container">
            <h3>Thống kê mô tả</h3>
            <div className="form-group">
                <label htmlFor="stats-input">Nhập dãy số (cách nhau bằng dấu phẩy hoặc khoảng trắng):</label>
                <textarea 
                    id="stats-input"
                    className="stats-input-area" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    rows="4"
                />
                <button onClick={handleCalculate} className="btn btn-primary">Tính toán</button>
            </div>
            {results && (
                 <div className="result-card">
                    <h3>Kết quả thống kê</h3>
                    {Object.entries(results).map(([key, value]) => (
                        <div key={key} className="rate-item">
                            <h4>{key}</h4>
                            <p className="price">{value}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const MathSolver: React.FC<SoundProps> = ({ playSound }) => {
  const [activeSolver, setActiveSolver] = useState('quadratic'); // 'quadratic', 'cubic', 'stats'

  const handleNavClick = (solverName: string) => {
    playSound('click');
    setActiveSolver(solverName);
  };

  return (
    <div className="tool-container math-solver">
      <h2 className="game-title">Công Cụ Toán Học</h2>
      <nav className="sub-nav">
        <button onClick={() => handleNavClick('quadratic')} className={activeSolver === 'quadratic' ? 'active' : ''}>
          PT Bậc 2
        </button>
        <button onClick={() => handleNavClick('cubic')} className={activeSolver === 'cubic' ? 'active' : ''}>
          PT Bậc 3
        </button>
        <button onClick={() => handleNavClick('stats')} className={activeSolver === 'stats' ? 'active' : ''}>
          Thống Kê
        </button>
      </nav>
      <div className="solver-content">
        {activeSolver === 'quadratic' && <QuadraticSolver />}
        {activeSolver === 'cubic' && <CubicSolver />}
        {activeSolver === 'stats' && <StatsCalculator />}
      </div>
    </div>
  );
};

const App = () => {
  const [activeApp, setActiveApp] = useState('bauCua');
  const [balance, setBalance] = useState<number>(1000);
  const [isMuted, setIsMuted] = useState(false);

  const playSound = useCallback((name: SoundName) => {
      if (!isMuted) {
          sounds[name].play();
      }
  }, [isMuted]);

  const handleNavClick = (appName: string) => {
    playSound('click');
    setActiveApp(appName);
  }

  return (
    <div className="app-container">
      <header>
        <div className="header-title-container">
            <h1>Trung Tâm Giải Trí</h1>
            <button className="mute-btn" onClick={() => setIsMuted(prev => !prev)} aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
                {isMuted ? '🔇' : '🔊'}
            </button>
        </div>
        <nav>
          <button onClick={() => handleNavClick('bauCua')} className={activeApp === 'bauCua' ? 'active' : ''}>
            Bầu Cua
          </button>
          <button onClick={() => handleNavClick('diceRoller')} className={activeApp === 'diceRoller' ? 'active' : ''}>
            Xí Ngầu
          </button>
          <button onClick={() => handleNavClick('sudoku')} className={activeApp === 'sudoku' ? 'active' : ''}>
            Sudoku
          </button>
          <button onClick={() => handleNavClick('memory')} className={activeApp === 'memory' ? 'active' : ''}>
            Trí Nhớ
          </button>
           <button onClick={() => handleNavClick('math')} className={activeApp === 'math' ? 'active' : ''}>
            Toán Học
          </button>
          <button onClick={() => handleNavClick('lunar')} className={activeApp === 'lunar' ? 'active' : ''}>
            Lịch Âm
          </button>
          <button onClick={() => handleNavClick('weather')} className={activeApp === 'weather' ? 'active' : ''}>
            Thời Tiết
          </button>
          <button onClick={() => handleNavClick('rates')} className={activeApp === 'rates' ? 'active' : ''}>
            Tỷ Giá
          </button>
        </nav>
      </header>
      <main>
        {activeApp === 'bauCua' && <BauCuaGame balance={balance} setBalance={setBalance} playSound={playSound} />}
        {activeApp === 'diceRoller' && <DiceRoller balance={balance} setBalance={setBalance} playSound={playSound} />}
        {activeApp === 'sudoku' && <SudokuGame playSound={playSound}/>}
        {activeApp === 'memory' && <MemoryGame playSound={playSound} />}
        {activeApp === 'math' && <MathSolver playSound={playSound} />}
        {activeApp === 'lunar' && <LunarCalendar />}
        {activeApp === 'weather' && <WeatherForecast />}
        {activeApp === 'rates' && <ExchangeRates />}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}