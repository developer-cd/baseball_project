import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, RefreshCw } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const FieldVisualizer = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    hasAdminPositions, 
    getAdminPositions, 
    requestUserPositions 
  } = useSocket();
  // Base positions (starting positions)
  const basePositions = {
    P: { x: 50, y: 56, color: 'bg-emerald-500', label: 'P' },
    C: { x: 50, y: 75, color: 'bg-blue-500', label: 'C' },
    '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' },
    '2B': { x: 58, y: 52, color: 'bg-pink-500', label: '2B' },
    '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' },
    SS: { x: 42, y: 52, color: 'bg-cyan-500', label: 'SS' },
    LF: { x: 28, y: 32, color: 'bg-amber-500', label: 'LF' },
    CF: { x: 50, y: 24, color: 'bg-emerald-500', label: 'CF' },
    RF: { x: 72, y: 32, color: 'bg-indigo-500', label: 'RF' }
  };

  // Scenario-based positions
  const scenarioPositions = {
    "Fly ball to LF": {
      P: { x: 50, y: 45, color: 'bg-emerald-500', label: 'P' }, // Move to backup position between mound and 2B
      C: { x: 60, y: 70, color: 'bg-blue-500', label: 'C' }, // Follow runner to 1B to back up
      '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' }, // Cover the bag after runner touches
      '2B': { x: 50, y: 52, color: 'bg-pink-500', label: '2B' }, // Cover 2B, receive throw
      '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' }, // Stay close to 3B bag
      SS: { x: 40, y: 35, color: 'bg-cyan-500', label: 'SS' }, // Line up relay throw from LF
      LF: { x: 20, y: 20, color: 'bg-amber-500', label: 'LF' }, // Make hard throw to 2B
      CF: { x: 30, y: 15, color: 'bg-emerald-500', label: 'CF' }, // Back up LF
      RF: { x: 65, y: 30, color: 'bg-indigo-500', label: 'RF' } // Back up position toward infield
    },
    "Ground ball to SS": {
      P: { x: 50, y: 60, color: 'bg-emerald-500', label: 'P' }, // Cover 1B
      C: { x: 50, y: 75, color: 'bg-blue-500', label: 'C' }, // Stay at home
      '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' }, // Cover 1B
      '2B': { x: 50, y: 52, color: 'bg-pink-500', label: '2B' }, // Cover 2B
      '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' }, // Cover 3B
      SS: { x: 45, y: 45, color: 'bg-cyan-500', label: 'SS' }, // Field the ball
      LF: { x: 25, y: 25, color: 'bg-amber-500', label: 'LF' }, // Back up SS
      CF: { x: 50, y: 20, color: 'bg-emerald-500', label: 'CF' }, // Back up SS
      RF: { x: 75, y: 25, color: 'bg-indigo-500', label: 'RF' } // Back up SS
    },
    "Bunt Defense": {
      P: { x: 50, y: 50, color: 'bg-emerald-500', label: 'P' }, // Charge the bunt
      C: { x: 50, y: 70, color: 'bg-blue-500', label: 'C' }, // Field the bunt
      '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' }, // Cover 1B
      '2B': { x: 50, y: 52, color: 'bg-pink-500', label: '2B' }, // Cover 2B
      '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' }, // Cover 3B
      SS: { x: 50, y: 40, color: 'bg-cyan-500', label: 'SS' }, // Cover 2B
      LF: { x: 25, y: 25, color: 'bg-amber-500', label: 'LF' }, // Back up 3B
      CF: { x: 50, y: 20, color: 'bg-emerald-500', label: 'CF' }, // Back up 2B
      RF: { x: 75, y: 25, color: 'bg-indigo-500', label: 'RF' } // Back up 1B
    }
  };

  const [positions, setPositions] = useState(basePositions);
  const [validationResults, setValidationResults] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [chancesLeft, setChancesLeft] = useState(3);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerAttempts, setPlayerAttempts] = useState({}); // Track attempts per player

  const [dragging, setDragging] = useState(null);
  const [totalMoves, setTotalMoves] = useState(9);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('Base Positions');
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminControlled, setIsAdminControlled] = useState(false);
  const [adminNotification, setAdminNotification] = useState(null);
  const [lastRequestedScenario, setLastRequestedScenario] = useState(null);
  const [adminPositionsSet, setAdminPositionsSet] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Check for admin positions when component mounts or scenario changes
  useEffect(() => {
    if (isConnected && selectedScenario && selectedScenario !== lastRequestedScenario) {
      setLastRequestedScenario(selectedScenario);
      requestUserPositions(selectedScenario);
    }
  }, [isConnected, selectedScenario]);

  // Check if admin has set positions for current scenario
  useEffect(() => {
    if (hasAdminPositions(selectedScenario)) {
      const adminData = getAdminPositions(selectedScenario);
      if (adminData && adminData.positions && !adminPositionsSet) {
        setPositions(adminData.positions);
        setAdminPositionsSet(true);
        setIsAdminControlled(false); // User can still drag on admin positions
        setAdminNotification(`Admin has set positions for ${selectedScenario}. You have 3 attempts to position correctly.`);
        setTimeout(() => setAdminNotification(null), 5000);
        // Reset attempts when admin positions are loaded
        setAttemptsUsed(0);
        setChancesLeft(3);
        setGameOver(false);
      }
    } else {
      setIsAdminControlled(false);
      setAdminNotification(null);
      setAdminPositionsSet(false);
    }
  }, [selectedScenario, hasAdminPositions, getAdminPositions, adminPositionsSet]);

  const scenarios = [
    { 
      name: 'Base Positions', 
      description: 'Starting defensive positions',
      icon: '🏟️'
    },
    { 
      name: 'Fly ball to LF', 
      description: 'Fly ball to left field with no runners on base',
      icon: '⚾',
      active: true
    },
    { 
      name: 'Ground ball to SS', 
      description: 'Ground ball to shortstop positioning',
      icon: '⚾'
    },
    { 
      name: 'Bunt Defense', 
      description: 'Defensive positioning for expected bunt',
      icon: '⚾'
    },
    { 
      name: 'Runner on 1st', 
      description: 'Defensive shift with runner on first base',
      icon: '🏃'
    },
    { 
      name: 'Double Play Setup', 
      description: 'Positioning for potential double play situations',
      icon: '🔄'
    }
  ];

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scenario.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to handle scenario change
  const handleScenarioChange = (scenarioName) => {
    setSelectedScenario(scenarioName);
    setDropdownOpen(false);
    
    // Reset validation and chances when changing scenario
    setValidationResults({});
    setChancesLeft(3);
    setGameOver(false);
    
    // Update player positions based on scenario
    if (scenarioName === 'Base Positions') {
      setPositions(basePositions);
    } else if (scenarioPositions[scenarioName]) {
      setPositions(scenarioPositions[scenarioName]);
    }
  };

  // Function to reset to base positions
  const resetPositions = () => {
    setPositions(basePositions);
    setSelectedScenario('Base Positions');
    setValidationResults({});
    setShowValidation(false);
    setChancesLeft(3);
    setGameOver(false);
  };

  // Real-time validation function
  const validatePlayerPosition = (playerKey, newPosition) => {
    console.log('Validating player:', playerKey, 'at position:', newPosition);
    const correctPositions = scenarioPositions[selectedScenario] || basePositions;
    const correctPos = correctPositions[playerKey];
    
    console.log('Correct position for', playerKey, ':', correctPos);
    
    if (correctPos) {
      const distance = Math.sqrt(
        Math.pow(newPosition.x - correctPos.x, 2) + 
        Math.pow(newPosition.y - correctPos.y, 2)
      );
      
      const isCorrect = distance <= 8; // 8% tolerance
      
      console.log('Distance:', distance, 'Is correct:', isCorrect);
      
      setValidationResults(prev => {
        const newResults = {
          ...prev,
          [playerKey]: {
            isCorrect,
            distance: Math.round(distance * 10) / 10,
            correctX: correctPos.x,
            correctY: correctPos.y
          }
        };
        
        // Check if all positions are correct
        setTimeout(() => {
          const allCorrect = Object.keys(correctPositions).every(key => 
            newResults[key] && newResults[key].isCorrect
          );
          
          if (allCorrect) {
            // Show win popup with video
            const showWinPopup = () => {
              // Create popup container
              const popup = document.createElement('div');
              popup.id = 'winPopup';
              popup.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                font-family: Arial, sans-serif;
              `;
              
              // Create content div
              const contentDiv = document.createElement('div');
              contentDiv.style.cssText = `
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 800px;
                width: 95%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                max-height: 90vh;
                overflow-y: auto;
              `;
              
              // Create title
              const title = document.createElement('h2');
              title.textContent = '🎉 Well Played!';
              title.style.cssText = `
                color: #10b981;
                margin-bottom: 20px;
                font-size: 32px;
                font-weight: bold;
              `;
              
              // Create message
              const message = document.createElement('p');
              message.textContent = 'Congratulations! You won! All positions are correct!';
              message.style.cssText = `
                color: #374151;
                margin-bottom: 30px;
                font-size: 20px;
              `;
              
              // Create YouTube iframe
              const video = document.createElement('iframe');
              video.id = 'winVideo';
              video.width = 500;
              video.height = 280;
              video.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=1&rel=0';
              video.frameBorder = '0';
              video.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
              video.allowFullscreen = true;
              video.style.cssText = `
                border-radius: 15px;
                margin-bottom: 20px;
                width: 100%;
                max-width: 500px;
                height: 280px;
                border: none;
              `;
              
              // Create button container
              const buttonContainer = document.createElement('div');
              buttonContainer.style.cssText = `
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 20px;
                padding: 20px;
                background: #f9fafb;
                border-radius: 10px;
                border: 2px solid #e5e7eb;
              `;
              
              // Create skip button
              const skipButton = document.createElement('button');
              skipButton.id = 'skipButton';
              skipButton.textContent = '⏭️ Skip Video';
              skipButton.style.cssText = `
                background: #f59e0b;
                color: white;
                border: 2px solid #d97706;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 18px;
                cursor: pointer;
                font-weight: bold;
                min-width: 160px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
              `;
              
              // Create back button
              const backButton = document.createElement('button');
              backButton.id = 'backButton';
              backButton.textContent = '← Back';
              backButton.style.cssText = `
                background: #6b7280;
                color: white;
                border: 2px solid #4b5563;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 18px;
                cursor: pointer;
                font-weight: bold;
                min-width: 140px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
              `;
              
              // Create OK button
              const okButton = document.createElement('button');
              okButton.id = 'closeWinPopup';
              okButton.textContent = 'OK';
              okButton.style.cssText = `
                background: #10b981;
                color: white;
                border: 2px solid #059669;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 18px;
                cursor: pointer;
                font-weight: bold;
                min-width: 140px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
              `;
              
              // Assemble popup
              buttonContainer.appendChild(skipButton);
              buttonContainer.appendChild(backButton);
              buttonContainer.appendChild(okButton);
              contentDiv.appendChild(title);
              contentDiv.appendChild(message);
              contentDiv.appendChild(video);
              contentDiv.appendChild(buttonContainer);
              popup.appendChild(contentDiv);
              
              // Add to body
              document.body.appendChild(popup);
              
              // Debug: Check if buttons exist
              console.log('Buttons created:', {
                skipButton: document.getElementById('skipButton'),
                backButton: document.getElementById('backButton'),
                okButton: document.getElementById('closeWinPopup')
              });
              
              // Test: Add a simple alert to confirm popup is working
              setTimeout(() => {
                console.log('Popup should be visible now. Buttons:', {
                  skipVisible: document.getElementById('skipButton')?.offsetHeight > 0,
                  backVisible: document.getElementById('backButton')?.offsetHeight > 0,
                  okVisible: document.getElementById('closeWinPopup')?.offsetHeight > 0
                });
              }, 100);
              
              // Add event listeners
              skipButton.onclick = () => {
                console.log('Skip button clicked');
                document.body.removeChild(popup);
                resetGameAfterWin();
              };
              
              okButton.onclick = () => {
                console.log('OK button clicked');
                document.body.removeChild(popup);
                resetGameAfterWin();
              };
              
              backButton.onclick = () => {
                console.log('Back button clicked');
                document.body.removeChild(popup);
                // Just close popup, don't reset game
              };
              
              // YouTube iframe doesn't have onended event, so we'll rely on buttons
              // video.onended = () => {
              //   document.body.removeChild(popup);
              //   resetGameAfterWin();
              // };
              
              // Add escape key listener
              const handleEscape = (e) => {
                if (e.key === 'Escape') {
                  document.body.removeChild(popup);
                  document.removeEventListener('keydown', handleEscape);
                }
              };
              document.addEventListener('keydown', handleEscape);
            };
            
            const resetGameAfterWin = () => {
              // Complete page reset
              setValidationResults({}); // Clear all validation signs
              setShowValidation(false); // Hide validation display
              setAttemptsUsed(0); // Reset attempts
              setChancesLeft(3); // Reset chances
              setGameOver(false); // Reset game over
              setAdminPositionsSet(false); // Allow admin positions to be set again
              setPlayerAttempts({}); // Reset player attempts
              
              // Show admin positions again
              if (hasAdminPositions(selectedScenario)) {
                const adminData = getAdminPositions(selectedScenario);
                if (adminData && adminData.positions) {
                  setPositions(adminData.positions);
                  setIsAdminControlled(false);
                  setAdminNotification(`Game won! Admin positions reset for ${selectedScenario}. You have 3 attempts again.`);
                  setTimeout(() => setAdminNotification(null), 5000);
                }
              }
            };
            
            showWinPopup();
          }
        }, 100);
        
        return newResults;
      });
      
      // If wrong position, increment attempts for this specific player
      if (!isCorrect) {
        console.log('Wrong position! Player attempts:', playerAttempts[playerKey] + 1);
        
        // Increment attempts for this specific player
        setPlayerAttempts(prev => ({
          ...prev,
          [playerKey]: (prev[playerKey] || 0) + 1
        }));
        
        // Check if this player has reached 3 attempts
        if ((playerAttempts[playerKey] || 0) + 1 >= 3) {
          alert(`❌ Player ${playerKey} has reached maximum attempts (3). This player cannot be moved anymore.`);
        }
        
        // Check if 3 players have reached max attempts (game over condition)
        // We need to check after the current player's attempts are updated
        const updatedPlayerAttempts = {
          ...playerAttempts,
          [playerKey]: (playerAttempts[playerKey] || 0) + 1
        };
        
        const playersWithMaxAttempts = Object.keys(updatedPlayerAttempts).filter(key => 
          updatedPlayerAttempts[key] >= 3
        );
        
        console.log('Game Over Check:', {
          currentPlayer: playerKey,
          updatedAttempts: updatedPlayerAttempts,
          playersWithMaxAttempts,
          count: playersWithMaxAttempts.length
        });
        
        if (playersWithMaxAttempts.length === 3) {
          console.log('🎯 GAME OVER TRIGGERED! 3 players with max attempts:', playersWithMaxAttempts);
          console.log('Current player just reached 3 attempts:', playerKey, 'Total attempts:', updatedPlayerAttempts[playerKey]);
          setTimeout(() => {
            const allCorrect = Object.keys(correctPositions).every(key => 
              validationResults[key] && validationResults[key].isCorrect
            );
            
            if (!allCorrect) {
              // Game lost - show admin positions and reset
              alert('❌ Game Over! 3 players have reached maximum attempts. Showing admin positions.');
              
              // Complete page reset
              setValidationResults({}); // Clear all validation signs
              setShowValidation(false); // Hide validation display
              setAttemptsUsed(0); // Reset attempts
              setChancesLeft(3); // Reset chances
              setGameOver(false); // Reset game over
              setAdminPositionsSet(false); // Allow admin positions to be set again
              setPlayerAttempts({}); // Reset player attempts
              
              if (hasAdminPositions(selectedScenario)) {
                const adminData = getAdminPositions(selectedScenario);
                if (adminData && adminData.positions) {
                  setPositions(adminData.positions);
                  setIsAdminControlled(false);
                  setAdminNotification(`Game over! Admin positions reset for ${selectedScenario}. You have 3 attempts again.`);
                  setTimeout(() => setAdminNotification(null), 5000);
                }
              }
            }
          }, 1000);
        }
      }
    }
  };

  // Function to validate player positions
  const validatePositions = () => {
    const correctPositions = scenarioPositions[selectedScenario] || basePositions;
    const results = {};
    let correctCount = 0;
    let totalCount = 0;

    Object.keys(positions).forEach(player => {
      const currentPos = positions[player];
      const correctPos = correctPositions[player];
      
      if (correctPos) {
        // Check if player is within acceptable range (within 8% of correct position)
        const distance = Math.sqrt(
          Math.pow(currentPos.x - correctPos.x, 2) + 
          Math.pow(currentPos.y - correctPos.y, 2)
        );
        
        const isCorrect = distance <= 8; // 8% tolerance
        results[player] = {
          isCorrect,
          distance: Math.round(distance * 10) / 10,
          correctX: correctPos.x,
          correctY: correctPos.y
        };
        
        if (isCorrect) correctCount++;
        totalCount++;
      }
    });

    setValidationResults(results);
    setShowValidation(true);
    
    // Show feedback message
    const percentage = Math.round((correctCount / totalCount) * 100);
    if (percentage === 100) {
      alert(`🎉 Perfect! All players are in correct positions! (${correctCount}/${totalCount})`);
    } else if (percentage >= 80) {
      alert(`👍 Good job! ${correctCount}/${totalCount} players are correctly positioned (${percentage}%)`);
    } else if (percentage >= 60) {
      alert(`⚠️ Not bad! ${correctCount}/${totalCount} players are correctly positioned (${percentage}%). Keep practicing!`);
    } else {
      alert(`❌ Keep trying! Only ${correctCount}/${totalCount} players are correctly positioned (${percentage}%). Review the scenario and try again.`);
    }
  };

  const handleMouseDown = (key, e) => {
    e.preventDefault();
    
    // Check if player has reached max attempts (3)
    if (playerAttempts[key] >= 3) {
      alert(`❌ Player ${key} has reached maximum attempts (3). Cannot move this player anymore.`);
      return;
    }
    
    // User can only drag if not admin controlled
    if (!isAdminControlled) {
    setDragging(key);
    }
  };

  const handleMouseMove = (e) => {
    if (dragging && !isAdminControlled) {
      const field = document.getElementById('active-field');
      if (!field) return;
      const rect = field.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setPositions(prev => ({
        ...prev,
        [dragging]: {
          ...prev[dragging],
          x: Math.max(5, Math.min(95, x)),
          y: Math.max(5, Math.min(95, y))
        }
      }));
    }
  };

  const handleMouseUp = () => {
    if (dragging && !isAdminControlled) {
      // Validate the position when player is dropped
      validatePlayerPosition(dragging, positions[dragging]);
    }
    setDragging(null);
  };


  const playersList = [
    { key: 'P', label: 'Pitcher', color: 'bg-emerald-500' },
    { key: 'C', label: 'Catcher', color: 'bg-blue-500' },
    { key: '1B', label: '1st Base', color: 'bg-purple-500' },
    { key: '2B', label: '2nd Base', color: 'bg-pink-500' },
    { key: '3B', label: '3rd Base', color: 'bg-orange-500' },
    { key: 'SS', label: 'Shortstop', color: 'bg-cyan-500' },
    { key: 'LF', label: 'Left Field', color: 'bg-amber-500' },
    { key: 'CF', label: 'Center Field', color: 'bg-emerald-500' },
    { key: 'RF', label: 'Right Field', color: 'bg-indigo-500' }
  ];

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Browse Scenarios Modal */}
      {showBrowseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-700 rounded-lg w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="bg-emerald-600 rounded-t-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" opacity="0.5"/>
                      <circle cx="12" cy="12" r="6"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Training Scenarios</h2>
                    <p className="text-emerald-100 text-xs">{scenarios.length} defensive setups available</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBrowseModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-gray-700">
              <input
                type="text"
                placeholder="Search scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Scenarios List */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {filteredScenarios.map((scenario) => (
                <div
                  key={scenario.name}
                  onClick={() => {
                    handleScenarioChange(scenario.name);
                    setShowBrowseModal(false);
                  }}
                  className={`relative p-4 rounded-lg cursor-pointer transition-all ${
                    scenario.active 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className={`w-10 h-10 ${scenario.active ? 'bg-emerald-500' : 'bg-gray-500'} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 1v6m0 6v6m6-12h-6m0 6H6"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">{scenario.name}</h3>
                        <p className={`text-xs ${scenario.active ? 'text-emerald-100' : 'text-gray-400'}`}>
                          {scenario.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center ml-3">
                      {scenario.active && (
                        <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded">
                          Active
                        </span>
                      )}
                      <svg className={`w-5 h-5 ml-2 ${scenario.active ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/home')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-6"
            >
              <span className="mr-2">←</span>
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" opacity="0.5"/>
                  <circle cx="12" cy="12" r="6"/>
                </svg>
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">Field Visualizer</h1>
                <p className="text-xs text-gray-500">Interactive training system</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
            </button>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            <span className="text-sm font-medium text-gray-900">Live Session</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className={`grid gap-6 ${sidebarVisible ? 'grid-cols-12' : 'grid-cols-1'}`}>
          {/* Left Sidebar */}
          {sidebarVisible && (
          <div className="col-span-4 space-y-4">
            {/* Training Scenario Card */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" opacity="0.5"/>
                    <circle cx="12" cy="12" r="6"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Training Scenario</h2>
                  <p className="text-xs text-gray-500">Position your players correctly</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center text-sm mb-2">
                    <svg className="w-4 h-4 text-emerald-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-medium text-gray-900">Active Scenario</span>
                  </div>
                  
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      {selectedScenario}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {scenarios.map((scenario) => (
                        <button
                          key={scenario.name}
                          onClick={() => {
                            setSelectedScenario(scenario.name);
                            setDropdownOpen(false);
                            // Reset attempts when changing scenario
    setAttemptsUsed(0);
    setChancesLeft(3);
    setGameOver(false);
    setAdminPositionsSet(false);
    setPlayerAttempts({}); // Reset player attempts
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                          {scenario.name}
                          {scenario.name === selectedScenario && (
                            <svg className="w-4 h-4 ml-auto text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowBrowseModal(true)}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  <Menu className="w-4 h-4 mr-2" />
                  Browse All Scenarios
                </button>

                <button 
                  onClick={resetPositions}
                  className="flex items-center justify-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Positions
                </button>
              </div>
            </div>

            {/* Player Positions Card */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Player Positions</h2>
              </div>

              <div className="space-y-2">
                {playersList.map((player) => (
                  <div key={player.key} className="flex items-center py-1">
                    <div className={`w-8 h-8 ${player.color} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                      <span className="text-white text-xs font-semibold">{player.key}</span>
                    </div>
                    <span className="text-sm text-gray-700">{player.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Play Card */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">How to Play</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-emerald-600 font-semibold text-xs">1</span>
                  </div>
                  <span className="text-sm text-gray-600 pt-1">Drag players to correct field positions</span>
                </div>
                <div className="flex items-start">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-emerald-600 font-semibold text-xs">2</span>
                  </div>
                  <span className="text-sm text-gray-600 pt-1">Green glow indicates correct placement</span>
                </div>
                <div className="flex items-start">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-emerald-600 font-semibold text-xs">3</span>
                  </div>
                  <span className="text-sm text-gray-600 pt-1">Watch video clips to learn strategies</span>
                </div>
              </div>
            </div>

            {/* Session Stats Card */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Session Stats</h3>
                <span className="text-xs font-medium text-emerald-600">Live</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">0</div>
                  <div className="text-xs text-gray-500 mt-1">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalMoves}</div>
                  <div className="text-xs text-gray-500 mt-1">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0%</div>
                  <div className="text-xs text-gray-500 mt-1">Score</div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Main Field Area */}
          <div className={sidebarVisible ? "col-span-8" : "col-span-1"}>
            <div className="bg-emerald-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h2 className="text-base font-semibold text-gray-900">Active Field</h2>
                  {isAdminControlled && (
                    <div className="ml-3 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full animate-pulse">
                      Admin Control
                    </div>
                  )}
                  {adminNotification && (
                    <div className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-bounce">
                      {adminNotification}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">Correct</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">Incorrect</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full mr-2"></span>
                    <span className="text-gray-600">Unplaced</span>
                  </div>
                </div>
              </div>
              
              {/* Chances Counter */}
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <span className="text-yellow-700 font-semibold">Players with max attempts: {Object.keys(playerAttempts).filter(key => playerAttempts[key] >= 3).length}/3</span>
                      <div className="ml-2 flex space-x-1">
                        {[1, 2, 3].map((chance) => (
                          <div
                            key={chance}
                            className={`w-4 h-4 rounded-full ${
                              chance <= (3 - attemptsUsed) ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-2 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">Correct</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-2 flex items-center justify-center">
                        <span className="text-white text-xs">✗</span>
                      </div>
                      <span className="text-gray-700">Wrong</span>
                    </div>
                  </div>
                  {gameOver && (
                    <button 
                      onClick={resetPositions}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Baseball Field */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div 
                id="active-field"
                className="relative w-full rounded-lg overflow-hidden"
                style={{ 
                  height: '600px',
                  backgroundImage: 'url(/images/Baseball_Field.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#22c55e'
                }}
              >

                {/* Players */}
                {Object.entries(positions).map(([key, pos]) => {
                  const validation = validationResults[key];
                  const isCorrect = validation?.isCorrect;
                  const isIncorrect = validation && !validation.isCorrect;
                  
                  return (
                    <div
                      key={key}
                      className={`absolute w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform select-none ${
                        dragging === key ? 'scale-110 shadow-2xl' : ''
                      } ${isAdminControlled ? 'cursor-not-allowed opacity-75' : (playerAttempts[key] >= 3 ? 'cursor-not-allowed opacity-50' : 'cursor-move hover:scale-110')} ${showValidation ? (isCorrect ? 'ring-4 ring-green-500' : isIncorrect ? 'ring-4 ring-red-500' : '') : ''}`}
                      style={{
                        left: `calc(${pos.x}% - 16px)`,
                        top: `calc(${pos.y}% - 16px)`,
                        zIndex: dragging === key ? 50 : 10
                      }}
                      onMouseDown={(e) => handleMouseDown(key, e)}
                    >
                      {/* Player Image */}
                      <img 
                        src={`/images/players/${key.toLowerCase()}.png`}
                        alt={`${pos.label} Player`}
                        className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                        onError={(e) => {
                          // Fallback to colored circle if image doesn't exist
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      
                      {/* Fallback colored circle */}
                      <div 
                        className={`w-full h-full ${pos.color} rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-md`}
                        style={{ display: 'none' }}
                      >
                        {pos.label}
                      </div>
                      
                      {/* Real-time validation indicator */}
                      {validationResults[key] && (
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          isCorrect ? 'bg-green-500' : isIncorrect ? 'bg-red-500' : 'bg-gray-500'
                        }`}>
                          {isCorrect ? '✓' : isIncorrect ? '✗' : '?'}
                        </div>
                      )}
                      
                      {/* Player attempts indicator */}
                      {playerAttempts[key] > 0 && (
                        <div className={`absolute -bottom-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          playerAttempts[key] >= 3 ? 'bg-red-500' : 'bg-orange-500'
                        }`}>
                          {playerAttempts[key]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldVisualizer;