import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const generateRandomAlphabets = () => {
  const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const result = [];
  while (result.length < 5) {
    const randomIndex = Math.floor(Math.random() * alphabets.length);
    const alphabet = alphabets[randomIndex];
    if (!result.includes(alphabet)) {
      result.push(alphabet);
    }
  }
  return result.sort(() => Math.random() - 0.5);
};

const AlphabetBox = ({ letter, onDragStart, onTouchStart, id, isDraggable }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', letter);
    onDragStart(letter);
  };

  return (
    <div
      id={id}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onTouchStart={(e) => onTouchStart(e, letter)}
      className={`w-16 h-16 flex items-center justify-center text-2xl font-bold bg-white border-2 border-gray-300 rounded-lg shadow-md transform transition-transform hover:scale-105 ${isDraggable ? 'cursor-move' : ''}`}
    >
      {letter}
    </div>
  );
};

const DroppableBox = ({ letter, onDrop, id }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const letter = e.dataTransfer.getData('text/plain');
    onDrop(letter);
    setIsOver(false);
  };

  return (
    <div
      id={id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-16 h-16 border-2 rounded-lg flex items-center justify-center ${
        isOver ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-gray-100'
      } ${!letter ? 'bg-opacity-50' : ''}`}
    >
      {letter && <AlphabetBox letter={letter} isDraggable={false} />}
    </div>
  );
};

const GameBoard = () => {
  const [gameState, setGameState] = useState('idle');
  const [alphabets, setAlphabets] = useState([]);
  const [answer, setAnswer] = useState(Array(5).fill(null));
  const [timeLeft, setTimeLeft] = useState(30);
  const [result, setResult] = useState('');
  const [draggedLetter, setDraggedLetter] = useState(null);
  const boardRef = useRef(null);
  const touchStartPos = useRef(null);

  const startGame = useCallback(() => {
    const newAlphabets = generateRandomAlphabets();
    setAlphabets(newAlphabets);
    setAnswer(Array(5).fill(null));
    setTimeLeft(30);
    setResult('');
    setGameState('playing');
  }, []);

  const endGame = useCallback(() => {
    setGameState('ended');
    const sortedAlphabets = [...alphabets, ...answer.filter(Boolean)].sort();
    const isCorrect = answer.every((letter, index) => letter === sortedAlphabets[index]);
    setResult(isCorrect ? 'You won!' : 'You lost!');
  }, [alphabets, answer]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      endGame();
    }
  }, [gameState, timeLeft, endGame]);

  const handleDragStart = (letter) => {
    setDraggedLetter(letter);
  };

  const handleDrop = (letter, index) => {
    if (!answer[index]) {
      setAnswer((prev) => {
        const newAnswer = [...prev];
        newAnswer[index] = letter;
        return newAnswer;
      });
      setAlphabets((prev) => prev.filter((l) => l !== letter));
    }
    setDraggedLetter(null);
  };

  const handleTouchStart = (e, letter) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setDraggedLetter(letter);
  };

  const handleTouchMove = useCallback((e) => {
    if (!draggedLetter || !touchStartPos.current) return;

    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartPos.current.x);
    const diffY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Only prevent default if we're sure it's a drag and not a scroll
    if (diffX > 10 || diffY > 10) {
      e.preventDefault();
    }

    const draggedOverElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (draggedOverElement && draggedOverElement.id.startsWith('answer-')) {
      const index = parseInt(draggedOverElement.id.split('-')[1]);
      handleDrop(draggedLetter, index);
    }
  }, [draggedLetter]);

  const handleTouchEnd = () => {
    setDraggedLetter(null);
    touchStartPos.current = null;
  };

  useEffect(() => {
    if (draggedLetter) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [draggedLetter, handleTouchMove]);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Alphabet Arrangement Game</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-6" ref={boardRef}>
          <Button
            onClick={startGame}
            disabled={gameState === 'playing'}
            className="px-6 py-2 text-lg"
          >
            {gameState === 'idle' ? 'Play' : 'Play Again'}
          </Button>

          {gameState !== 'idle' && (
            <>
              <div className="text-2xl font-semibold">Time Left: {timeLeft}s</div>

              <div className="flex flex-wrap justify-center gap-4">
                {alphabets.map((letter, index) => (
                  <AlphabetBox
                    key={index}
                    id={`alphabet-${index}`}
                    letter={letter}
                    isDraggable={true}
                    onDragStart={handleDragStart}
                    onTouchStart={handleTouchStart}
                  />
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {answer.map((letter, index) => (
                  <DroppableBox
                    key={index}
                    id={`answer-${index}`}
                    letter={letter}
                    onDrop={(droppedLetter) => handleDrop(droppedLetter, index)}
                  />
                ))}
              </div>

              {result && (
                <div className={`text-2xl font-bold ${result === 'You won!' ? 'text-green-500' : 'text-red-500'}`}>
                  {result}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-indigo-600 p-4">
      <GameBoard />
    </div>
  );
}