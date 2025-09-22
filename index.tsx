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
            // Payout is 5-to-1: player gets their bet back + 5 times the bet.
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


// --- Sudoku Game ---
type Difficulty = 'easy' | 'medium' | 'expert';
type Board = (number | null)[][];
type ValidationBoard = ('correct' | 'incorrect' | 'empty')[][];

const SUDOKU_DIFFICULTY_LEVELS: Record<Difficulty, { name: string; cellsToRemove: number }> = {
    easy: { name: 'Đơn giản', cellsToRemove: 40 },
    medium: { name: 'Trung bình', cellsToRemove: 50 },
    expert: { name: 'Chuyên gia', cellsToRemove: 60 },
};

// Sudoku generation and solving utility functions
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
            setValidation(null); // Clear previous validation
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
        setDifficulty(null);
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

// --- Memory Game ---
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
        }
    }, [isGameWon, playSound]);

    if (!difficulty) {
         return (
            <div className="game-container memory-game">
                <h2 className="game-title">Thử Thách Trí Nhớ</h2>
                <div className="difficulty-selector">
                    <h3>Chọn cấp độ</h3>
                    {Object.entries(MEMORY_DIFFICULTY_LEVELS).map(([key, { name }]) => (
                        <button key={key} onClick={() => startGame(key as MemoryDifficulty)} className="btn btn-primary">
                            {name}
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


const App = () => {
  const [activeGame, setActiveGame] = useState('bauCua');
  const [balance, setBalance] = useState<number>(1000);
  const [isMuted, setIsMuted] = useState(false);

  const playSound = useCallback((name: SoundName) => {
      if (!isMuted) {
          sounds[name].play();
      }
  }, [isMuted]);

  const handleNavClick = (game: string) => {
    playSound('click');
    setActiveGame(game);
  }

  return (
    <div className="app-container">
      <header>
        <div className="header-title-container">
            <h1>Trò Chơi May Rủi</h1>
            <button className="mute-btn" onClick={() => setIsMuted(prev => !prev)} aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
                {isMuted ? '🔇' : '🔊'}
            </button>
        </div>
        <nav>
          <button onClick={() => handleNavClick('bauCua')} className={activeGame === 'bauCua' ? 'active' : ''}>
            Bầu Cua
          </button>
          <button onClick={() => handleNavClick('diceRoller')} className={activeGame === 'diceRoller' ? 'active' : ''}>
            Xí Ngầu
          </button>
          <button onClick={() => handleNavClick('sudoku')} className={activeGame === 'sudoku' ? 'active' : ''}>
            Sudoku
          </button>
          <button onClick={() => handleNavClick('memory')} className={activeGame === 'memory' ? 'active' : ''}>
            Trí Nhớ
          </button>
        </nav>
      </header>
      <main>
        {activeGame === 'bauCua' && <BauCuaGame balance={balance} setBalance={setBalance} playSound={playSound} />}
        {activeGame === 'diceRoller' && <DiceRoller balance={balance} setBalance={setBalance} playSound={playSound} />}
        {activeGame === 'sudoku' && <SudokuGame playSound={playSound}/>}
        {activeGame === 'memory' && <MemoryGame playSound={playSound} />}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}