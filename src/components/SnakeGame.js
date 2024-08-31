import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SnakeGame.css';

const GRID_SIZE = 10;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 4, y: 5 },
  { x: 3, y: 5 },
  { x: 2, y: 5 },
];

const SPEEDS = {
  SLOW: 300,
  NORMAL: 200,
  FAST: 100
};

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const speedRef = useRef('NORMAL');
  const directionRef = useRef(direction);
  const gameSpeedRef = useRef(SPEEDS.NORMAL);

  const createAudio = (path) => {
    const audio = new Audio(process.env.PUBLIC_URL + path);
    audio.onerror = (e) => console.error(`Error loading audio file ${path}:`, e);
    return audio;
  };

  const eatSound = useRef(createAudio('/eat.mp3'));
  const deadSound = useRef(createAudio('/dead.mp3'));

  const playSound = (sound) => {
    if (sound.readyState === 4) {
      sound.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    } else {
      console.error('Audio not ready to play');
    }
  };

  useEffect(() => {
    eatSound.current.oncanplaythrough = () => console.log('Eat sound loaded');
    deadSound.current.oncanplaythrough = () => console.log('Dead sound loaded');
  }, []);

  const isCollision = useCallback((head) => {
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (directionRef.current) {
        case 'UP': head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE; break;
        case 'DOWN': head.y = (head.y + 1) % GRID_SIZE; break;
        case 'LEFT': head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE; break;
        case 'RIGHT': head.x = (head.x + 1) % GRID_SIZE; break;
        default: break;
      }

      if (isCollision(head)) {
        setGameOver(true);
        playSound(deadSound.current);
        return prevSnake;
      }

      newSnake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        playSound(eatSound.current);
        setFood(getRandomFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, isCollision, gameStarted]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const gameLoop = setInterval(() => {
        moveSnake();
      }, gameSpeedRef.current);

      return () => clearInterval(gameLoop);
    }
  }, [moveSnake, gameStarted, gameOver]);

  const handleDirection = useCallback((newDirection) => {
    const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (opposites[directionRef.current] !== newDirection) {
      directionRef.current = newDirection;
      setDirection(newDirection);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowUp': handleDirection('UP'); break;
        case 'ArrowDown': handleDirection('DOWN'); break;
        case 'ArrowLeft': handleDirection('LEFT'); break;
        case 'ArrowRight': handleDirection('RIGHT'); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleDirection]);

  const handleSpeedChange = useCallback((newSpeed) => {
    speedRef.current = newSpeed;
    gameSpeedRef.current = SPEEDS[newSpeed];
  }, []);

  const getRandomFood = useCallback(() => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  const restartGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFood());
    directionRef.current = 'RIGHT';
    setDirection('RIGHT');
    setGameOver(false);
  }, [getRandomFood]);

  const renderCell = useCallback((x, y) => {
    const isSnake = snake.some(segment => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;
    return (
      <div
        key={`${x},${y}`}
        className={`cell ${isSnake ? 'snake' : ''} ${isFood ? 'food' : ''}`}
      />
    );
  }, [snake, food]);

  // Add this effect to handle audio context activation
  useEffect(() => {
    const unlockAudio = () => {
      eatSound.current.play().then(() => {
        eatSound.current.pause();
        eatSound.current.currentTime = 0;
      }).catch(err => console.log('Audio play failed', err));

      deadSound.current.play().then(() => {
        deadSound.current.pause();
        deadSound.current.currentTime = 0;
      }).catch(err => console.log('Audio play failed', err));

      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFood());
    directionRef.current = 'RIGHT';
    setDirection('RIGHT');
  };

  return (
    <div className="phone-container">
      <div className="phone-screen">
        <div className="game-title">SNAKE</div>
        {!gameStarted ? (
          <button className="start-btn" onClick={startGame}>Start Game</button>
        ) : (
          <>
            <div className="game-board">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE;
                const y = Math.floor(index / GRID_SIZE);
                return renderCell(x, y);
              })}
            </div>
            <div className="score">Score: {snake.length - INITIAL_SNAKE.length}</div>
          </>
        )}
      </div>
      <div className="controls">
        <button className="control-btn" onClick={() => handleDirection('UP')}>↑</button>
        <div>
          <button className="control-btn" onClick={() => handleDirection('LEFT')}>←</button>
          <button className="control-btn" onClick={() => handleDirection('RIGHT')}>→</button>
        </div>
        <button className="control-btn" onClick={() => handleDirection('DOWN')}>↓</button>
      </div>
      <div className="speed-controls">
        <button className={`speed-btn ${speedRef.current === 'SLOW' ? 'active' : ''}`} onClick={() => handleSpeedChange('SLOW')}>Slow</button>
        <button className={`speed-btn ${speedRef.current === 'NORMAL' ? 'active' : ''}`} onClick={() => handleSpeedChange('NORMAL')}>Normal</button>
        <button className={`speed-btn ${speedRef.current === 'FAST' ? 'active' : ''}`} onClick={() => handleSpeedChange('FAST')}>Fast</button>
      </div>
      {gameOver && (
        <div className="game-over">
          <div>Game Over!</div>
          <button className="restart-btn" onClick={startGame}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
