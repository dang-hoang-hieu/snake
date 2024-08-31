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

const SPEEDS = {
  SLOW: 200,    // 200ms per move
  NORMAL: 150,  // 150ms per move
  FAST: 100     // 100ms per move (current speed)
};

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const speedRef = useRef('NORMAL');
  const directionRef = useRef(direction);
  const requestRef = useRef();
  const lastUpdateTimeRef = useRef(0);
  const gameSpeedRef = useRef(SPEEDS.NORMAL); // ms per move
  const [, forceUpdate] = useState();

  useEffect(() => {
    gameSpeedRef.current = SPEEDS[speedRef.current];
  }, []);

  const moveSnake = useCallback((timestamp) => {
    if (timestamp - lastUpdateTimeRef.current >= gameSpeedRef.current) {
      setSnake((prevSnake) => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };

        switch (directionRef.current) {
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

      lastUpdateTimeRef.current = timestamp;
    }

    if (!gameOver) {
      requestRef.current = requestAnimationFrame(moveSnake);
    }
  }, [food, gameOver]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(moveSnake);
    return () => cancelAnimationFrame(requestRef.current);
  }, [moveSnake]);

  useEffect(() => {
    gameSpeedRef.current = SPEEDS[speedRef.current];
  }, []);

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
    forceUpdate({}); // Force a re-render without changing state
  }, []);

  const SpeedButton = useCallback(({ speedOption }) => (
    <button
      style={{
        padding: '5px 10px',
        margin: '0 5px',
        backgroundColor: speedRef.current === speedOption ? '#4CAF50' : '#8BC34A',
        border: 'none',
        borderRadius: '5px',
        color: 'white',
        cursor: 'pointer'
      }}
      onClick={() => handleSpeedChange(speedOption)}
    >
      {speedOption.charAt(0) + speedOption.slice(1).toLowerCase()}
    </button>
  ), [handleSpeedChange]);

  const DirectionButton = ({ direction, label }) => {
    const handlePress = (e) => {
      e.preventDefault();
      handleDirection(direction);
    };

    return (
      <button
        style={{
          width: '60px',
          height: '60px',
          margin: '5px',
          fontSize: '24px',
          backgroundColor: '#8BC34A',
          border: 'none',
          borderRadius: '5px',
          color: 'white',
          touchAction: 'manipulation',
        }}
        onTouchStart={handlePress}
        onMouseDown={handlePress}
      >
        {label}
      </button>
    );
  };

  const getRandomFood = useCallback(() => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  const isCollision = useCallback((snakeToCheck) => {
    const head = snakeToCheck[0];
    return snakeToCheck.slice(1).some((segment) => segment.x === head.x && segment.y === head.y);
  }, []);

  const restartGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFood());
    directionRef.current = 'RIGHT';
    setDirection('RIGHT');
    setGameOver(false);
    requestRef.current = requestAnimationFrame(moveSnake);
  }, [getRandomFood, moveSnake]);

  const renderCell = useCallback((x, y) => {
    const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;

    return (
      <div
        key={`${x}-${y}`}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: isSnake ? 'green' : isFood ? 'red' : 'white',
          border: '1px solid #ccc',
        }}
      />
    );
  }, [snake, food]);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <SpeedButton speedOption="SLOW" />
        <SpeedButton speedOption="NORMAL" />
        <SpeedButton speedOption="FAST" />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: '1px',
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
