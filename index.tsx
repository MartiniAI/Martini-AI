import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

const BAU_CUA_ITEMS = [
  { id: 'nai', name: 'Nai', emoji: '🦌' },
  { id: 'bau', name: 'Bầu', emoji: '🎃' },
  { id: 'ga', name: 'Gà', emoji: '🐓' },
  { id: 'ca', name: 'Cá', emoji: '🐟' },
  { id: 'cua', name: 'Cua', emoji: '🦀' },
  { id: 'tom', name: 'Tôm', emoji: '🦐' },
];

const BET_AMOUNT = 10;

interface GameProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

const BauCuaGame: React.FC<GameProps> = ({ balance, setBalance }) => {
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
    setBalance(prev => prev - BET_AMOUNT);
    setBets(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + BET_AMOUNT }));
  };

  const clearBets = () => {
    if (isShaking) return;
    setBalance(prev => prev + totalBet);
    setBets({});
  };

  const handleShake = () => {
    if (totalBet === 0 || isShaking) return;

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
      } else if (netChange < 0) {
        setMessage(`Thua ${-netChange}.`);
      } else {
        setMessage('Hòa vốn!');
      }

      setBets({});
      setIsShaking(false);
    }, 1000);
  };
  
  return (
    <div className="bau-cua-game">
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

const DiceRoller: React.FC<GameProps> = ({ balance, setBalance }) => {
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
        setBalance(prev => prev - BET_AMOUNT);
        setBets(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + BET_AMOUNT }));
    };

    const clearBets = () => {
        if (isRolling) return;
        setBalance(prev => prev + totalBet);
        setBets({});
    };

    const handleRoll = () => {
        if (totalBet === 0 || isRolling) return;

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
            } else if (netChange < 0) {
                setMessage(`Thua ${-netChange}. Chúc may mắn lần sau!`);
            } else {
                setMessage('Bạn không cược nên không có gì thay đổi.');
            }

            setBets({});
            setIsRolling(false);
            setResult(roll);
        }, 1000);
    };

    return (
        <div className="dice-roller">
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


const App = () => {
  const [activeGame, setActiveGame] = useState('bauCua');
  const [balance, setBalance] = useState<number>(1000);

  return (
    <div className="app-container">
      <header>
        <h1>Trò Chơi May Rủi</h1>
        <nav>
          <button onClick={() => setActiveGame('bauCua')} className={activeGame === 'bauCua' ? 'active' : ''}>
            Bầu Cua
          </button>
          <button onClick={() => setActiveGame('diceRoller')} className={activeGame === 'diceRoller' ? 'active' : ''}>
            Xí Ngầu
          </button>
        </nav>
      </header>
      <main>
        {activeGame === 'bauCua' && <BauCuaGame balance={balance} setBalance={setBalance} />}
        {activeGame === 'diceRoller' && <DiceRoller balance={balance} setBalance={setBalance} />}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
