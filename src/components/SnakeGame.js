import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 10;
const CELL_SIZE = 30;
const INITIAL_SNAKE = [
  { x: 4, y: 5 },
  { x: 3, y: 5 },
  { x: 2, y: 5 },
  { x: 1, y: 5 },
  { x: 0, y: 5 },
];

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [cellSize, setCellSize] = useState(30);
  const gameAreaRef = useRef(null);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case 'UP':
          head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'DOWN':
          head.y = (head.y + 1) % GRID_SIZE;
          break;
        case 'LEFT':
          head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'RIGHT':
          head.x = (head.x + 1) % GRID_SIZE;
          break;
        default:
          break;
      }

      newSnake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        setFood(getRandomFood());
      } else {
        newSnake.pop();
      }

      if (isCollision(newSnake)) {
        setGameOver(true);
      }

      return newSnake;
    });
  }, [direction, food, gameOver]);

  const handleDirection = useCallback((newDirection) => {
    setDirection((prevDirection) => {
      const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
      return opposites[prevDirection] !== newDirection ? newDirection : prevDirection;
    });
  }, []);

  const DirectionButton = ({ direction, label }) => (
    <button
      style={{
        width: '50px',
        height: '50px',
        margin: '5px',
        fontSize: '20px',
        touchAction: 'manipulation'
      }}
      onClick={() => handleDirection(direction)}
    >
      {label}
    </button>
  );

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

    document.addEventListener('keydown', handleKeyPress);
    const gameInterval = setInterval(moveSnake, 200);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameInterval);
    };
  }, [moveSnake, handleDirection]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (!startX || !startY) return;

    const touch = e.touches[0];
    const diffX = startX - touch.clientX;
    const diffY = startY - touch.clientY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      handleDirection(diffX > 0 ? 'LEFT' : 'RIGHT');
    } else {
      // Vertical swipe
      handleDirection(diffY > 0 ? 'UP' : 'DOWN');
    }

    setStartX(0);
    setStartY(0);
  };

  const getRandomFood = () => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  };

  const isCollision = (snakeToCheck) => {
    const head = snakeToCheck[0];
    return snakeToCheck.slice(1).some((segment) => segment.x === head.x && segment.y === head.y);
  };

  const renderCell = (x, y) => {
    const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;

    return (
      <div
        key={`${x}-${y}`}
        style={{
          aspectRatio: '1 / 1',
          backgroundColor: isSnake ? 'green' : isFood ? 'red' : 'white',
          border: '1px solid #ccc',
        }}
      />
    );
  };

  useEffect(() => {
    const updateCellSize = () => {
      const gameArea = gameAreaRef.current;
      if (gameArea) {
        const size = Math.min(
          Math.floor((window.innerWidth * 0.9) / GRID_SIZE),
          Math.floor((window.innerHeight * 0.5) / GRID_SIZE)
        );
        setCellSize(size);
      }
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  const restartGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFood());
    setDirection('RIGHT');
    setGameOver(false);
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div
        ref={gameAreaRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '1px',
          aspectRatio: '1 / 1',
          width: '60vmin',
          maxWidth: '60vw',
          maxHeight: '60vw',
          margin: '0 auto',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);
          return renderCell(x, y);
        })}
      </div>
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <DirectionButton direction="UP" label="↑" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <DirectionButton direction="LEFT" label="←" />
          <DirectionButton direction="RIGHT" label="→" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <DirectionButton direction="DOWN" label="↓" />
        </div>
      </div>
      {gameOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}
          onClick={restartGame}
        >
          Game Over! Tap to restart
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
