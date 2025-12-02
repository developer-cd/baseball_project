import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Video, 
  Settings, 
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  BarChart3,
  FileText,
  Database,
  Target,
  Move,
  RotateCcw,
  Save,
  Eye,
  RefreshCw,
  TrendingUp,
  Clock,
  Activity,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "./ui/button";
import { Stage, Layer, Line as KonvaLine, Arrow as KonvaArrow, Circle as KonvaCircle } from "react-konva";
import { useRef } from "react";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";

export function AdminDashboard({ onBack, onViewCoachDashboard }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState({
    username: '',
    email: '',
    role: 'user'
  });
  const { user } = useAuth();
  const { 
    socket,
    isConnected, 
    saveAdminPositions, 
    updateAdminPositions, 
    clearAdminPositions,
    saveAdminGuidelines,
    updateAdminGuidelines,
    clearAdminGuidelines,
    requestUserGuidelines,
    requestUserPositions,
    getGuidelines,
    getAdminPositions,
    hasAdminPositions,
    adminPositions,
    adminGuidelines
  } = useSocket();

  // Field control state
  const [positions, setPositions] = useState({
    P: { x: 50, y: 56, color: 'bg-emerald-500', label: 'P' },
    C: { x: 50, y: 75, color: 'bg-blue-500', label: 'C' },
    '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' },
    '2B': { x: 58, y: 52, color: 'bg-pink-500', label: '2B' },
    '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' },
    SS: { x: 42, y: 52, color: 'bg-cyan-500', label: 'SS' },
    LF: { x: 28, y: 32, color: 'bg-amber-500', label: 'LF' },
    CF: { x: 50, y: 24, color: 'bg-emerald-500', label: 'CF' },
    RF: { x: 72, y: 32, color: 'bg-indigo-500', label: 'RF' }
  });

  const [selectedScenario, setSelectedScenario] = useState('Base Positions');
  const [adminDragging, setAdminDragging] = useState(null);
  const [fieldMode, setFieldMode] = useState('positions'); // 'positions', 'guidelines', or 'correctPositions'
  
  // Scenario management state
  const [scenarios, setScenarios] = useState([]);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [scenarioForm, setScenarioForm] = useState({
    name: '',
    description: '',
    icon: '⚾'
  });
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // Guidelines state
  const [shapes, setShapes] = useState([]); // {id,type,points:[%],stroke,strokeWidth}
  const [tool, setTool] = useState('arrow'); // 'line' | 'arrow' | 'dottedArrow'
  const [stroke, setStroke] = useState('#000000'); // black default
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPoints, setTempPoints] = useState([]); // in % while drawing
  const fieldContainerRef = useRef(null);
  
  // Correct Positions state (arrow + circle for each player)
  const [correctPositionShapes, setCorrectPositionShapes] = useState([]); // {playerKey, arrowPoints, circleCenter}
  const [selectedPlayerForCorrectPos, setSelectedPlayerForCorrectPos] = useState(null); // Track which player we're setting correct position for

  const toPixels = (percentPoints, ref) => {
    const el = ref.current;
    if (!el || !percentPoints || percentPoints.length < 2) return [];
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    const out = [];
    for (let i = 0; i < percentPoints.length; i += 2) {
      out.push((percentPoints[i] / 100) * w);
      out.push((percentPoints[i + 1] / 100) * h);
    }
    return out;
  };

  // Scenario-based positions
  const scenarioPositions = {
    "Base Positions": {
      P: { x: 50, y: 56, color: 'bg-emerald-500', label: 'P' },
      C: { x: 50, y: 75, color: 'bg-blue-500', label: 'C' },
      '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' },
      '2B': { x: 58, y: 52, color: 'bg-pink-500', label: '2B' },
      '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' },
      SS: { x: 42, y: 52, color: 'bg-cyan-500', label: 'SS' },
      LF: { x: 28, y: 32, color: 'bg-amber-500', label: 'LF' },
      CF: { x: 50, y: 24, color: 'bg-emerald-500', label: 'CF' },
      RF: { x: 72, y: 32, color: 'bg-indigo-500', label: 'RF' }
    },
    "Fly ball to LF": {
      P: { x: 50, y: 45, color: 'bg-emerald-500', label: 'P' },
      C: { x: 60, y: 70, color: 'bg-blue-500', label: 'C' },
      '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' },
      '2B': { x: 50, y: 52, color: 'bg-pink-500', label: '2B' },
      '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' },
      SS: { x: 40, y: 35, color: 'bg-cyan-500', label: 'SS' },
      LF: { x: 20, y: 20, color: 'bg-amber-500', label: 'LF' },
      CF: { x: 30, y: 15, color: 'bg-emerald-500', label: 'CF' },
      RF: { x: 65, y: 30, color: 'bg-indigo-500', label: 'RF' }
    },
    "Ground ball to SS": {
      P: { x: 50, y: 60, color: 'bg-emerald-500', label: 'P' },
      C: { x: 50, y: 75, color: 'bg-blue-500', label: 'C' },
      '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' },
      '2B': { x: 50, y: 52, color: 'bg-pink-500', label: '2B' },
      '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' },
      SS: { x: 45, y: 45, color: 'bg-cyan-500', label: 'SS' },
      LF: { x: 25, y: 25, color: 'bg-amber-500', label: 'LF' },
      CF: { x: 50, y: 20, color: 'bg-emerald-500', label: 'CF' },
      RF: { x: 75, y: 25, color: 'bg-indigo-500', label: 'RF' }
    },
    "Bunt Defense": {
      P: { x: 50, y: 50, color: 'bg-emerald-500', label: 'P' },
      C: { x: 50, y: 70, color: 'bg-blue-500', label: 'C' },
      '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' },
      '2B': { x: 50, y: 52, color: 'bg-pink-500', label: '2B' },
      '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' },
      SS: { x: 50, y: 40, color: 'bg-cyan-500', label: 'SS' },
      LF: { x: 25, y: 25, color: 'bg-amber-500', label: 'LF' },
      CF: { x: 50, y: 20, color: 'bg-emerald-500', label: 'CF' },
      RF: { x: 75, y: 25, color: 'bg-indigo-500', label: 'RF' }
    },
    "Runner on 1st": {
      P: { x: 50, y: 55, color: 'bg-emerald-500', label: 'P' },
      C: { x: 50, y: 75, color: 'bg-blue-500', label: 'C' },
      '1B': { x: 65, y: 60, color: 'bg-purple-500', label: '1B' },
      '2B': { x: 55, y: 50, color: 'bg-pink-500', label: '2B' },
      '3B': { x: 40, y: 65, color: 'bg-orange-500', label: '3B' },
      SS: { x: 45, y: 45, color: 'bg-cyan-500', label: 'SS' },
      LF: { x: 30, y: 30, color: 'bg-amber-500', label: 'LF' },
      CF: { x: 50, y: 25, color: 'bg-emerald-500', label: 'CF' },
      RF: { x: 70, y: 30, color: 'bg-indigo-500', label: 'RF' }
    },
    "Double Play Setup": {
      P: { x: 50, y: 60, color: 'bg-emerald-500', label: 'P' },
      C: { x: 50, y: 75, color: 'bg-blue-500', label: 'C' },
      '1B': { x: 68, y: 66, color: 'bg-purple-500', label: '1B' },
      '2B': { x: 55, y: 48, color: 'bg-pink-500', label: '2B' },
      '3B': { x: 35, y: 66, color: 'bg-orange-500', label: '3B' },
      SS: { x: 48, y: 42, color: 'bg-cyan-500', label: 'SS' },
      LF: { x: 25, y: 25, color: 'bg-amber-500', label: 'LF' },
      CF: { x: 50, y: 20, color: 'bg-emerald-500', label: 'CF' },
      RF: { x: 75, y: 25, color: 'bg-indigo-500', label: 'RF' }
    }
  };

  // Admin drag and drop handlers
  const handleAdminMouseDown = (key, e) => {
    e.preventDefault();
    // Only allow dragging in positions mode, not in correctPositions mode
    if (fieldMode === 'positions') {
      setAdminDragging(key);
    } else if (fieldMode === 'correctPositions') {
      // In correctPositions mode, select player for arrow drawing
      setSelectedPlayerForCorrectPos(key);
    }
  };

  const handleAdminMouseMove = (e) => {
    // Only allow dragging in positions mode, not in correctPositions or guidelines mode
    if (adminDragging && fieldMode === 'positions') {
      const field = document.getElementById('admin-field');
      if (!field) return;
      const rect = field.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setPositions(prev => ({
        ...prev,
        [adminDragging]: {
          ...prev[adminDragging],
          x: Math.max(5, Math.min(95, x)),
          y: Math.max(5, Math.min(95, y))
        }
      }));
    }
  };

  const handleAdminMouseUp = () => {
    if (adminDragging) {
      setAdminDragging(null);
    }
  };

  // Reset dragging when mode changes to guidelines
  useEffect(() => {
    if (fieldMode === 'guidelines' && adminDragging) {
      setAdminDragging(null);
    }
  }, [fieldMode, adminDragging]);

  // Save positions to backend
  const handleSavePositions = () => {
    if (isConnected) {
      saveAdminPositions(selectedScenario, positions);
      
      // Show success popup
      const showSuccessPopup = () => {
        const popup = document.createElement('div');
        popup.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
          font-family: Arial, sans-serif;
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
          background: white;
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        `;
        
        const title = document.createElement('h2');
        title.textContent = '✅ Success!';
        title.style.cssText = `
          color: #10b981;
          margin-bottom: 20px;
          font-size: 28px;
          font-weight: bold;
        `;
        
        const message = document.createElement('p');
        message.textContent = `You have successfully set positions for "${selectedScenario}"!`;
        message.style.cssText = `
          color: #374151;
          margin-bottom: 30px;
          font-size: 18px;
          line-height: 1.5;
        `;
        
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.style.cssText = `
          background: #10b981;
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 10px;
          font-size: 18px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;
        
        contentDiv.appendChild(title);
        contentDiv.appendChild(message);
        contentDiv.appendChild(okButton);
        popup.appendChild(contentDiv);
        document.body.appendChild(popup);
        
        okButton.onclick = () => {
          document.body.removeChild(popup);
        };
        
        // Auto close after 3 seconds
        setTimeout(() => {
          if (document.body.contains(popup)) {
            document.body.removeChild(popup);
          }
        }, 3000);
      };
      
      showSuccessPopup();
    } else {
      alert('Not connected to server. Please refresh and try again.');
    }
  };

  // Clear positions
  const handleClearPositions = () => {
    if (isConnected) {
      clearAdminPositions(selectedScenario);
      // Reset to default positions after clearing
      if (scenarioPositions[selectedScenario]) {
        setPositions(scenarioPositions[selectedScenario]);
      }
      alert('Positions cleared successfully!');
    } else {
      alert('Not connected to server. Please refresh and try again.');
    }
  };

  // Load saved positions for a scenario
  const loadSavedPositions = async (scenario) => {
    try {
      // First try to get from socket context (in-memory cache)
      const adminData = getAdminPositions(scenario);
      if (adminData && adminData.positions) {
        setPositions(adminData.positions);
        return;
      }

      // If not in cache, fetch from API
      const response = await axios.get(`/admin/positions/${encodeURIComponent(scenario)}`);
      if (response.data.success && response.data.fieldPosition) {
        const savedPositions = response.data.fieldPosition.positions;
        if (savedPositions && Object.keys(savedPositions).length > 0) {
          // Mongoose Map is already converted to object in JSON response
          // Ensure all required fields exist
          const positionsObj = {};
          Object.keys(savedPositions).forEach(key => {
            const pos = savedPositions[key];
            if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
              positionsObj[key] = {
                x: pos.x,
                y: pos.y,
                color: pos.color || scenarioPositions[scenario]?.[key]?.color || 'bg-gray-500',
                label: pos.label || key
              };
            }
          });
          if (Object.keys(positionsObj).length > 0) {
            setPositions(positionsObj);
            return;
          }
        }
      }
      // No saved positions found, use defaults
      if (scenarioPositions[scenario]) {
        setPositions(scenarioPositions[scenario]);
      }
    } catch (error) {
      console.error('Error loading saved positions:', error);
      // On error, use defaults
      if (scenarioPositions[scenario]) {
        setPositions(scenarioPositions[scenario]);
      }
    }
  };

  // Load saved correct positions for a scenario
  const loadSavedCorrectPositions = async (scenario) => {
    try {
      const response = await axios.get(`/admin/correct-positions/${encodeURIComponent(scenario)}`);
      if (response.data.success && response.data.correctPosition && response.data.correctPosition.positions) {
        const correctPositions = response.data.correctPosition.positions;
        // Convert positions to arrow + circle shapes
        const shapes = [];
        Object.keys(correctPositions).forEach(playerKey => {
          const correctPos = correctPositions[playerKey];
          const playerPos = positions[playerKey];
          if (playerPos && correctPos && typeof correctPos.x === 'number' && typeof correctPos.y === 'number') {
            // Create arrow from player's current position to correct position
            shapes.push({
              playerKey: playerKey,
              arrowPoints: [playerPos.x, playerPos.y, correctPos.x, correctPos.y],
              circleCenter: { x: correctPos.x, y: correctPos.y }
            });
          }
        });
        setCorrectPositionShapes(shapes);
      } else {
        setCorrectPositionShapes([]);
      }
    } catch (error) {
      console.error('Error loading saved correct positions:', error);
      setCorrectPositionShapes([]);
    }
  };

  // Change scenario
  const handleScenarioChange = (scenario) => {
    setSelectedScenario(scenario);
    // Load saved positions for this scenario (or defaults if not saved)
    loadSavedPositions(scenario);
    // Load saved correct positions for this scenario
    loadSavedCorrectPositions(scenario);
    // Also request via socket for real-time updates
    if (isConnected) {
      requestUserPositions(scenario);
    }
    // Load guidelines for this scenario
    requestUserGuidelines(scenario);
    const g = getGuidelines(scenario);
    setShapes(g?.shapes || []);
  };

  // Fetch scenarios from API
  const fetchScenarios = async () => {
    setLoadingScenarios(true);
    try {
      const response = await axios.get('/admin/scenarios');
      if (response.data.success) {
        setScenarios(response.data.scenarios);
        // Set first scenario as selected if none selected
        if (response.data.scenarios.length > 0 && !response.data.scenarios.find(s => s.name === selectedScenario)) {
          setSelectedScenario(response.data.scenarios[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    } finally {
      setLoadingScenarios(false);
    }
  };

  // On mount, load scenarios and current scenario positions and guidelines
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchScenarios();
      // Load saved positions for initial scenario
      await loadSavedPositions(selectedScenario);
      // Request via socket for real-time updates
      if (isConnected) {
        requestUserPositions(selectedScenario);
      }
      // Load guidelines
      requestUserGuidelines(selectedScenario);
    };
    loadInitialData();
  }, [isConnected]);

  // Load correct positions after positions are loaded
  useEffect(() => {
    if (Object.keys(positions).length > 0) {
      loadSavedCorrectPositions(selectedScenario);
    }
  }, [selectedScenario, positions]);

  // Sync positions from socket context when they arrive (for real-time updates)
  useEffect(() => {
    if (isConnected && hasAdminPositions(selectedScenario)) {
      const adminData = getAdminPositions(selectedScenario);
      if (adminData && adminData.positions) {
        setPositions(adminData.positions);
      }
    }
  }, [selectedScenario, isConnected, adminPositions, getAdminPositions, hasAdminPositions]);

  // Keep local shapes in sync with broadcasts/updates
  useEffect(() => {
    const g = getGuidelines(selectedScenario);
    if (g && Array.isArray(g.shapes)) {
      setShapes(g.shapes);
    }
  }, [adminGuidelines, selectedScenario]);

  // Fetch admin statistics
  const fetchStats = async () => {
    try {
      console.log('Fetching admin stats...', { user, isAdmin: user?.role === 'admin' });
      const response = await axios.get('/admin-stats/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401) {
        console.error('Unauthorized - User might not be admin or token expired');
      } else if (error.response?.status === 403) {
        console.error('Forbidden - User does not have admin role');
      }
    }
  };

  // Fetch users list
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/admin-stats/users');
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchUsers()]);
    setRefreshing(false);
  };

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    
    try {
      const response = await axios.post('/admin-stats/users', newUser);
      if (response.data.success) {
        // Show success popup
        const showSuccessPopup = () => {
          const popup = document.createElement('div');
          popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            font-family: Arial, sans-serif;
          `;
          
          const isCoach = newUser.role === 'coach';
          const registrationLink = response.data.data?.registrationLink;
          
          const contentDiv = document.createElement('div');
          contentDiv.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: ${isCoach ? '600px' : '400px'};
            width: 90%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          `;
          
          const title = document.createElement('h2');
          title.textContent = '✅ User Created!';
          title.style.cssText = `
            color: #10b981;
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: bold;
          `;
          
          const message = document.createElement('p');
          message.textContent = `User "${newUser.username}" has been created successfully with ${newUser.role} role!`;
          message.style.cssText = `
            color: #374151;
            margin-bottom: ${isCoach ? '20px' : '30px'};
            font-size: 18px;
            line-height: 1.5;
          `;
          
          contentDiv.appendChild(title);
          contentDiv.appendChild(message);
          
          // If coach, show registration link
          if (isCoach && registrationLink) {
            const linkSection = document.createElement('div');
            linkSection.style.cssText = `
              background: #f0f9ff;
              border: 2px solid #0ea5e9;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
              text-align: left;
            `;
            
            const linkLabel = document.createElement('p');
            linkLabel.textContent = 'Registration Link (Share with team members):';
            linkLabel.style.cssText = `
              font-weight: bold;
              color: #0c4a6e;
              margin-bottom: 10px;
              font-size: 14px;
            `;
            
            const linkContainer = document.createElement('div');
            linkContainer.style.cssText = `
              display: flex;
              gap: 10px;
              align-items: center;
            `;
            
            const linkInput = document.createElement('input');
            linkInput.type = 'text';
            linkInput.value = registrationLink;
            linkInput.readOnly = true;
            linkInput.style.cssText = `
              flex: 1;
              padding: 10px;
              border: 1px solid #bae6fd;
              border-radius: 6px;
              font-size: 12px;
              background: white;
              color: #0c4a6e;
            `;
            
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy';
            copyButton.style.cssText = `
              background: #0ea5e9;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
              font-weight: bold;
              white-space: nowrap;
            `;
            
            copyButton.onclick = () => {
              linkInput.select();
              document.execCommand('copy');
              const originalText = copyButton.textContent;
              copyButton.textContent = 'Copied!';
              copyButton.style.background = '#10b981';
              setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.background = '#0ea5e9';
              }, 2000);
            };
            
            linkContainer.appendChild(linkInput);
            linkContainer.appendChild(copyButton);
            linkSection.appendChild(linkLabel);
            linkSection.appendChild(linkContainer);
            contentDiv.appendChild(linkSection);
            
            const infoText = document.createElement('p');
            infoText.textContent = 'Note: Maximum 15 users can register using this link.';
            infoText.style.cssText = `
              color: #64748b;
              font-size: 12px;
              margin-top: 10px;
              font-style: italic;
            `;
            linkSection.appendChild(infoText);
          }
          
          const okButton = document.createElement('button');
          okButton.textContent = 'OK';
          okButton.style.cssText = `
            background: #10b981;
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 18px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          `;
          
          contentDiv.appendChild(okButton);
          popup.appendChild(contentDiv);
          document.body.appendChild(popup);
          
          okButton.onclick = () => {
            document.body.removeChild(popup);
          };
          
          // Auto close after 5 seconds (longer for coach to copy link)
          setTimeout(() => {
            if (document.body.contains(popup)) {
              document.body.removeChild(popup);
            }
          }, isCoach ? 10000 : 3000);
        };
        
        showSuccessPopup();
        
        // Reset form and close modal
        setNewUser({ username: '', email: '', password: '', role: 'user' });
        setShowAddUserModal(false);
        
        // Refresh users list
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreatingUser(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Only fetch data if user is admin
      if (user?.role === 'admin') {
        setLoading(true);
        await Promise.all([fetchStats(), fetchUsers()]);
        setLoading(false);
      } else {
        console.warn('User is not admin, skipping data fetch');
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Get coach registration link
  const handleGetCoachLink = async (coachId) => {
    try {
      const response = await axios.get(`/admin-stats/coaches/${coachId}/registration-link`);
      if (response.data.success) {
        const { registrationLink, teamInfo } = response.data.data;
        
        // Show popup with registration link
        const popup = document.createElement('div');
        popup.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
          font-family: Arial, sans-serif;
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
          background: white;
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        `;
        
        const title = document.createElement('h2');
        title.textContent = '📋 Coach Registration Link';
        title.style.cssText = `
          color: #0ea5e9;
          margin-bottom: 20px;
          font-size: 28px;
          font-weight: bold;
        `;
        
        const linkSection = document.createElement('div');
        linkSection.style.cssText = `
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: left;
        `;
        
        const linkLabel = document.createElement('p');
        linkLabel.textContent = 'Registration Link (Share with team members):';
        linkLabel.style.cssText = `
          font-weight: bold;
          color: #0c4a6e;
          margin-bottom: 10px;
          font-size: 14px;
        `;
        
        const linkContainer = document.createElement('div');
        linkContainer.style.cssText = `
          display: flex;
          gap: 10px;
          align-items: center;
        `;
        
        const linkInput = document.createElement('input');
        linkInput.type = 'text';
        linkInput.value = registrationLink;
        linkInput.readOnly = true;
        linkInput.style.cssText = `
          flex: 1;
          padding: 10px;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          font-size: 12px;
          background: white;
          color: #0c4a6e;
        `;
        
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.style.cssText = `
          background: #0ea5e9;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          font-weight: bold;
          white-space: nowrap;
        `;
        
        copyButton.onclick = () => {
          linkInput.select();
          document.execCommand('copy');
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          copyButton.style.background = '#10b981';
          setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.style.background = '#0ea5e9';
          }, 2000);
        };
        
        linkContainer.appendChild(linkInput);
        linkContainer.appendChild(copyButton);
        linkSection.appendChild(linkLabel);
        linkSection.appendChild(linkContainer);
        
        const infoText = document.createElement('p');
        infoText.textContent = `Team Status: ${teamInfo.currentMembers}/${teamInfo.maxMembers} members (${teamInfo.availableSlots} slots available)`;
        infoText.style.cssText = `
          color: #64748b;
          font-size: 12px;
          margin-top: 10px;
          font-style: italic;
        `;
        linkSection.appendChild(infoText);
        
        const okButton = document.createElement('button');
        okButton.textContent = 'Close';
        okButton.style.cssText = `
          background: #10b981;
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 10px;
          font-size: 18px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;
        
        contentDiv.appendChild(title);
        contentDiv.appendChild(linkSection);
        contentDiv.appendChild(okButton);
        popup.appendChild(contentDiv);
        document.body.appendChild(popup);
        
        okButton.onclick = () => {
          document.body.removeChild(popup);
        };
      }
    } catch (error) {
      console.error('Error fetching coach link:', error);
      alert('Error fetching registration link: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/admin-stats/users/${userId}`);
      if (response.data.success) {
        // Show success popup
        const showSuccessPopup = () => {
          const popup = document.createElement('div');
          popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            font-family: Arial, sans-serif;
          `;
          
          const contentDiv = document.createElement('div');
          contentDiv.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          `;
          
          const title = document.createElement('h2');
          title.textContent = '✅ User Deleted!';
          title.style.cssText = `
            color: #10b981;
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: bold;
          `;
          
          const message = document.createElement('p');
          message.textContent = 'User has been deleted successfully!';
          message.style.cssText = `
            color: #374151;
            margin-bottom: 30px;
            font-size: 18px;
            line-height: 1.5;
          `;
          
          const okButton = document.createElement('button');
          okButton.textContent = 'OK';
          okButton.style.cssText = `
            background: #10b981;
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 18px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          `;
          
          contentDiv.appendChild(title);
          contentDiv.appendChild(message);
          contentDiv.appendChild(okButton);
          popup.appendChild(contentDiv);
          document.body.appendChild(popup);
          
          okButton.onclick = () => {
            document.body.removeChild(popup);
          };
          
          // Auto close after 3 seconds
          setTimeout(() => {
            if (document.body.contains(popup)) {
              document.body.removeChild(popup);
            }
          }, 3000);
        };
        
        showSuccessPopup();
        
        // Refresh users list
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setShowEditModal(true);
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.put(`/admin-stats/users/${editingUser._id}`, editUserData);
      if (response.data.success) {
        // Show success popup
        const showSuccessPopup = () => {
          const popup = document.createElement('div');
          popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            font-family: Arial, sans-serif;
          `;
          
          const contentDiv = document.createElement('div');
          contentDiv.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          `;
          
          const title = document.createElement('h2');
          title.textContent = '✅ User Updated!';
          title.style.cssText = `
            color: #10b981;
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: bold;
          `;
          
          const message = document.createElement('p');
          message.textContent = `User "${editUserData.username}" has been updated successfully!`;
          message.style.cssText = `
            color: #374151;
            margin-bottom: 30px;
            font-size: 18px;
            line-height: 1.5;
          `;
          
          const okButton = document.createElement('button');
          okButton.textContent = 'OK';
          okButton.style.cssText = `
            background: #10b981;
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 18px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          `;
          
          contentDiv.appendChild(title);
          contentDiv.appendChild(message);
          contentDiv.appendChild(okButton);
          popup.appendChild(contentDiv);
          document.body.appendChild(popup);
          
          okButton.onclick = () => {
            document.body.removeChild(popup);
          };
          
          // Auto close after 3 seconds
          setTimeout(() => {
            if (document.body.contains(popup)) {
              document.body.removeChild(popup);
            }
          }, 3000);
        };
        
        showSuccessPopup();
        
        // Reset form and close modal
        setEditUserData({ username: '', email: '', role: 'user' });
        setShowEditModal(false);
        setEditingUser(null);
        
        // Refresh users list
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-blue-50/30 tech-grid">
      {/* helper to convert % points to pixels */}
      {/* placed inside component scope */}
      {null}
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/20 glass-panel shadow-lg">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all hover:gap-3 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Full platform control</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={onViewCoachDashboard}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Coach View
              </Button>
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Admin Mode ({user?.role || 'Unknown'})
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="glass-panel rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Total Users</p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? '...' : stats?.totalUsers || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.usersByRole ? 
                `${stats.usersByRole.admin || 0} admins • ${stats.usersByRole.coach || 0} coaches • ${stats.usersByRole.user || 0} players` 
                : 'Loading...'
              }
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Scenarios</p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? '...' : stats?.scenariosCount || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.popularScenarios?.length > 0 ? 
                `Most used: ${stats.popularScenarios[0]?._id || 'N/A'}` 
                : 'No scenarios yet'
              }
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Active Users</p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? '...' : stats?.activeUsers || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Last 24 hours
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Database className="w-6 h-6 text-white" />
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Clock className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Total Sessions</p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? '...' : stats?.totalSessions || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.sessionsThisWeek || 0} this week
            </p>
          </div>
        </div>

        {/* Management Tabs */}
        <div className="glass-panel rounded-3xl shadow-xl border border-white/30 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-white/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <TabsList className="w-full justify-start p-4 bg-transparent h-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white/50">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-white/50">
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-white/50">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Content Management
                </TabsTrigger>
                <TabsTrigger value="videos" className="data-[state=active]:bg-white/50">
                  <Video className="w-4 h-4 mr-2" />
                  Video Library
                </TabsTrigger>
                <TabsTrigger value="field" className="data-[state=active]:bg-white/50">
                  <Target className="w-4 h-4 mr-2" />
                  Field Control
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-white/50">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Platform Overview</h2>
                  <Button 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel rounded-2xl p-6 border border-white/20">
                    <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading activity...</p>
                        </div>
                      ) : stats?.recentActivity?.length > 0 ? (
                        stats.recentActivity.slice(0, 5).map((activity, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {activity.description} by {activity.user}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {activity.timeAgo}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-6 border border-white/20">
                    <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button className="w-full justify-start" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New User
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Situation
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Video
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Popular Scenarios */}
                {stats?.popularScenarios?.length > 0 && (
                  <div className="glass-panel rounded-2xl p-6 border border-white/20">
                    <h3 className="font-semibold text-foreground mb-4">Popular Scenarios</h3>
                    <div className="space-y-2">
                      {stats.popularScenarios.map((scenario, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{scenario._id}</span>
                          <span className="text-xs text-muted-foreground">
                            {scenario.count} sessions
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">User Management</h2>
                  <Button 
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>

                {/* Search and filters */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/50 border-white/30"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>

                {/* Users table */}
                <div className="glass-panel rounded-2xl border border-white/20 overflow-hidden">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-4">Loading users...</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20 bg-white/30">
                          <th className="text-left p-4 text-sm font-medium">User</th>
                          <th className="text-left p-4 text-sm font-medium">Role</th>
                          <th className="text-left p-4 text-sm font-medium">Status</th>
                          <th className="text-left p-4 text-sm font-medium">Joined</th>
                          <th className="text-right p-4 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length > 0 ? (
                          users.map((user) => (
                            <tr key={user._id} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold text-white">
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{user.username}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-700'
                                    : user.role === 'coach'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${
                                    user.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                  }`} />
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {new Date(user.joinedAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {user.role === 'coach' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleGetCoachLink(user._id)}
                                      className="hover:bg-green-50 text-green-600"
                                      title="View Registration Link"
                                    >
                                      <LinkIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    className="hover:bg-blue-50"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteUser(user._id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-12">
                              <p className="text-sm text-muted-foreground">No users found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content" className="p-6">
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">Content Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage defensive situations, descriptions, and training content
                </p>
                <Button className="bg-gradient-to-r from-green-600 to-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Situation
                </Button>
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="p-6">
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">Video Library</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload and manage training videos for each defensive situation
                </p>
                <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            </TabsContent>

            {/* Field Control Tab */}
            <TabsContent value="field" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Field Control</h2>
                    <p className="text-sm text-muted-foreground">Set player positions for training scenarios</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isConnected 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                </div>

                {/* Scenario Selection */}
                <div className="glass-panel rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Select Scenario</h3>
                    <Button
                      onClick={() => {
                        setEditingScenario(null);
                        setScenarioForm({ name: '', description: '', icon: '⚾' });
                        setShowScenarioModal(true);
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Scenario
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {scenarios.length > 0 ? (
                      scenarios.map((scenario) => {
                        const isSelected = selectedScenario === scenario.name;
                        return (
                        <div key={scenario._id || scenario.name} className="relative group">
                          <Button
                            onClick={() => handleScenarioChange(scenario.name)}
                            variant={isSelected ? "default" : "outline"}
                            className={`w-full justify-start text-sm relative ${
                              isSelected 
                                ? 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-700 shadow-lg' 
                                : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
                            }`}
                          >
                            <span className="mr-2">{scenario.icon || '⚾'}</span>
                            <span className="flex-1 text-left">{scenario.name}</span>
                            {isSelected && (
                              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </Button>
                          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setEditingScenario(scenario);
                                setScenarioForm({
                                  name: scenario.name,
                                  description: scenario.description || '',
                                  icon: scenario.icon || '⚾'
                                });
                                setShowScenarioModal(true);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete scenario "${scenario.name}"?`)) {
                                  try {
                                    await axios.delete(`/admin/scenarios/${scenario._id}`);
                                    fetchScenarios();
                                    if (selectedScenario === scenario.name) {
                                      setSelectedScenario(scenarios[0]?.name || 'Base Positions');
                                    }
                                  } catch (error) {
                                    alert('Error deleting scenario: ' + (error.response?.data?.error || error.message));
                                  }
                                }
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                        {loadingScenarios ? 'Loading scenarios...' : 'No scenarios found. Create one!'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="glass-panel rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground mb-0">Select Mode</h3>
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={() => setFieldMode('positions')}
                        className={fieldMode === 'positions' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 hover:bg-gray-300'}
                        variant={fieldMode === 'positions' ? 'default' : 'outline'}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Set Positions
                      </Button>
                      <Button 
                        onClick={() => setFieldMode('correctPositions')}
                        className={fieldMode === 'correctPositions' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200 hover:bg-gray-300'}
                        variant={fieldMode === 'correctPositions' ? 'default' : 'outline'}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Set Correct Positions
                      </Button>
                      <Button 
                        onClick={() => setFieldMode('guidelines')}
                        className={fieldMode === 'guidelines' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-200 hover:bg-gray-300'}
                        variant={fieldMode === 'guidelines' ? 'default' : 'outline'}
                      >
                        <Move className="w-4 h-4 mr-2" />
                        Set Guidelines
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    {fieldMode === 'positions' 
                      ? '📍 Click "Set Positions" to move players on the field. Drag players to set their positions.' 
                      : fieldMode === 'correctPositions'
                      ? '✅ Click "Set Correct Positions" to set the correct positions for validation. Users will be validated against these positions.'
                      : '✏️ Click "Set Guidelines" to draw arrows and lines. Use drawing tools below to create guidelines.'}
                  </p>
                </div>

                {/* Interactive Field */}
                <div className="glass-panel rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">
                      {fieldMode === 'positions' ? 'Position Players' : fieldMode === 'correctPositions' ? 'Set Correct Positions for Validation' : 'Draw Guidelines'}
                    </h3>
                    <div className="flex items-center gap-2">
                      {fieldMode === 'positions' ? (
                        <>
                          <Button onClick={handleSavePositions} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4 mr-2" />
                            Save Positions
                          </Button>
                          <Button onClick={handleClearPositions} variant="destructive">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear Positions
                          </Button>
                        </>
                      ) : fieldMode === 'correctPositions' ? (
                        <>
                          <Button
                            onClick={async () => {
                              if (!isConnected) {
                                alert('Not connected to server. Please refresh and try again.');
                                return;
                              }
                              try {
                                // Convert correctPositionShapes to positions format
                                const correctPositionsMap = {};
                                correctPositionShapes.forEach(shape => {
                                  const playerPos = positions[shape.playerKey];
                                  correctPositionsMap[shape.playerKey] = {
                                    x: shape.circleCenter.x,
                                    y: shape.circleCenter.y,
                                    color: playerPos.color,
                                    label: playerPos.label
                                  };
                                });
                                
                                const response = await axios.post('/admin/correct-positions', {
                                  scenario: selectedScenario,
                                  positions: correctPositionsMap
                                });
                                if (response.data.success) {
                                  // Show success popup
                                  const showSuccessPopup = () => {
                                    const popup = document.createElement('div');
                                    popup.style.cssText = `
                                      position: fixed;
                                      top: 0;
                                      left: 0;
                                      width: 100vw;
                                      height: 100vh;
                                      background: rgba(0, 0, 0, 0.5);
                                      display: flex;
                                      justify-content: center;
                                      align-items: center;
                                      z-index: 99999;
                                      font-family: Arial, sans-serif;
                                    `;
                                    
                                    const contentDiv = document.createElement('div');
                                    contentDiv.style.cssText = `
                                      background: white;
                                      padding: 40px;
                                      border-radius: 20px;
                                      text-align: center;
                                      max-width: 400px;
                                      width: 90%;
                                      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                                    `;
                                    
                                    const title = document.createElement('h2');
                                    title.textContent = '✅ Success!';
                                    title.style.cssText = `
                                      color: #2563eb;
                                      margin-bottom: 20px;
                                      font-size: 28px;
                                      font-weight: bold;
                                    `;
                                    
                                    const message = document.createElement('p');
                                    message.textContent = `Correct positions saved for "${selectedScenario}". Users will be validated against these positions.`;
                                    message.style.cssText = `
                                      color: #374151;
                                      margin-bottom: 30px;
                                      font-size: 18px;
                                      line-height: 1.5;
                                    `;
                                    
                                    const okButton = document.createElement('button');
                                    okButton.textContent = 'OK';
                                    okButton.style.cssText = `
                                      background: #2563eb;
                                      color: white;
                                      border: none;
                                      padding: 15px 40px;
                                      border-radius: 10px;
                                      font-size: 18px;
                                      cursor: pointer;
                                      font-weight: bold;
                                      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                                    `;
                                    
                                    contentDiv.appendChild(title);
                                    contentDiv.appendChild(message);
                                    contentDiv.appendChild(okButton);
                                    popup.appendChild(contentDiv);
                                    document.body.appendChild(popup);
                                    
                                    okButton.onclick = () => {
                                      document.body.removeChild(popup);
                                    };
                                    
                                    setTimeout(() => {
                                      if (document.body.contains(popup)) {
                                        document.body.removeChild(popup);
                                      }
                                    }, 3000);
                                  };
                                  
                                  showSuccessPopup();
                                }
                              } catch (error) {
                                alert('Error saving correct positions: ' + (error.response?.data?.error || error.message));
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Save Correct Positions
                          </Button>
                          <Button
                            onClick={() => {
                              // Clear local state only (doesn't delete from server)
                              setCorrectPositionShapes([]);
                              setSelectedPlayerForCorrectPos(null);
                            }}
                            variant="outline"
                            size="sm"
                            className="bg-gray-200 hover:bg-gray-300"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear
                          </Button>
                          <Button
                            onClick={async () => {
                              if (!isConnected) {
                                alert('Not connected to server. Please refresh and try again.');
                                return;
                              }
                              if (window.confirm(`Clear correct positions for "${selectedScenario}"? This will delete from server.`)) {
                                try {
                                  await axios.delete(`/admin/correct-positions/${encodeURIComponent(selectedScenario)}`);
                                  // Clear local state
                                  setCorrectPositionShapes([]);
                                  setSelectedPlayerForCorrectPos(null);
                                  // Show success popup
                                  const showSuccessPopup = () => {
                                    const popup = document.createElement('div');
                                    popup.style.cssText = `
                                      position: fixed;
                                      top: 0;
                                      left: 0;
                                      width: 100vw;
                                      height: 100vh;
                                      background: rgba(0, 0, 0, 0.5);
                                      display: flex;
                                      justify-content: center;
                                      align-items: center;
                                      z-index: 99999;
                                      font-family: Arial, sans-serif;
                                    `;
                                    
                                    const contentDiv = document.createElement('div');
                                    contentDiv.style.cssText = `
                                      background: white;
                                      padding: 40px;
                                      border-radius: 20px;
                                      text-align: center;
                                      max-width: 400px;
                                      width: 90%;
                                      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                                    `;
                                    
                                    const title = document.createElement('h2');
                                    title.textContent = '✅ Cleared!';
                                    title.style.cssText = `
                                      color: #2563eb;
                                      margin-bottom: 20px;
                                      font-size: 28px;
                                      font-weight: bold;
                                    `;
                                    
                                    const message = document.createElement('p');
                                    message.textContent = `Correct positions cleared for "${selectedScenario}".`;
                                    message.style.cssText = `
                                      color: #374151;
                                      margin-bottom: 30px;
                                      font-size: 18px;
                                      line-height: 1.5;
                                    `;
                                    
                                    const okButton = document.createElement('button');
                                    okButton.textContent = 'OK';
                                    okButton.style.cssText = `
                                      background: #2563eb;
                                      color: white;
                                      border: none;
                                      padding: 15px 40px;
                                      border-radius: 10px;
                                      font-size: 18px;
                                      cursor: pointer;
                                      font-weight: bold;
                                      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                                    `;
                                    
                                    contentDiv.appendChild(title);
                                    contentDiv.appendChild(message);
                                    contentDiv.appendChild(okButton);
                                    popup.appendChild(contentDiv);
                                    document.body.appendChild(popup);
                                    
                                    okButton.onclick = () => {
                                      document.body.removeChild(popup);
                                    };
                                    
                                    setTimeout(() => {
                                      if (document.body.contains(popup)) {
                                        document.body.removeChild(popup);
                                      }
                                    }, 3000);
                                  };
                                  
                                  showSuccessPopup();
                                } catch (error) {
                                  alert('Error clearing correct positions: ' + (error.response?.data?.error || error.message));
                                }
                              }
                            }}
                            variant="destructive"
                            size="sm"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear Correct Positions
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => {
                        console.log('Saving guidelines', { scenario: selectedScenario, shapesCount: shapes.length });
                        if (!isConnected) { 
                          alert('Not connected to server. Please refresh and try again.');
                          return;
                        }
                        saveAdminGuidelines(selectedScenario, shapes);
                        
                        // Show success popup
                        const showSuccessPopup = () => {
                          const popup = document.createElement('div');
                          popup.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            background: rgba(0, 0, 0, 0.5);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 99999;
                            font-family: Arial, sans-serif;
                          `;
                          
                          const contentDiv = document.createElement('div');
                          contentDiv.style.cssText = `
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            text-align: center;
                            max-width: 400px;
                            width: 90%;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                          `;
                          
                          const title = document.createElement('h2');
                          title.textContent = '✅ Success!';
                          title.style.cssText = `
                            color: #10b981;
                            margin-bottom: 20px;
                            font-size: 28px;
                            font-weight: bold;
                          `;
                          
                          const message = document.createElement('p');
                          message.textContent = `You have successfully saved guidelines for "${selectedScenario}"!`;
                          message.style.cssText = `
                            color: #374151;
                            margin-bottom: 30px;
                            font-size: 18px;
                            line-height: 1.5;
                          `;
                          
                          const okButton = document.createElement('button');
                          okButton.textContent = 'OK';
                          okButton.style.cssText = `
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 15px 40px;
                            border-radius: 10px;
                            font-size: 18px;
                            cursor: pointer;
                            font-weight: bold;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                          `;
                          
                          contentDiv.appendChild(title);
                          contentDiv.appendChild(message);
                          contentDiv.appendChild(okButton);
                          popup.appendChild(contentDiv);
                          document.body.appendChild(popup);
                          
                          okButton.onclick = () => {
                            document.body.removeChild(popup);
                          };
                          
                          // Auto close after 3 seconds
                          setTimeout(() => {
                            if (document.body.contains(popup)) {
                              document.body.removeChild(popup);
                            }
                          }, 3000);
                        };
                        
                        showSuccessPopup();
                      }} className="bg-emerald-600 hover:bg-emerald-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save Guidelines
                      </Button>
                      <Button onClick={() => {
                        if (!isConnected) { 
                          alert('Not connected to server. Please refresh and try again.');
                          return;
                        }
                        clearAdminGuidelines(selectedScenario);
                        setShapes([]);
                        
                        // Show success popup
                        const showSuccessPopup = () => {
                          const popup = document.createElement('div');
                          popup.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            background: rgba(0, 0, 0, 0.5);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 99999;
                            font-family: Arial, sans-serif;
                          `;
                          
                          const contentDiv = document.createElement('div');
                          contentDiv.style.cssText = `
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            text-align: center;
                            max-width: 400px;
                            width: 90%;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                          `;
                          
                          const title = document.createElement('h2');
                          title.textContent = '✅ Cleared!';
                          title.style.cssText = `
                            color: #10b981;
                            margin-bottom: 20px;
                            font-size: 28px;
                            font-weight: bold;
                          `;
                          
                          const message = document.createElement('p');
                          message.textContent = `Guidelines cleared for "${selectedScenario}". You can now draw new guidelines.`;
                          message.style.cssText = `
                            color: #374151;
                            margin-bottom: 30px;
                            font-size: 18px;
                            line-height: 1.5;
                          `;
                          
                          const okButton = document.createElement('button');
                          okButton.textContent = 'OK';
                          okButton.style.cssText = `
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 15px 40px;
                            border-radius: 10px;
                            font-size: 18px;
                            cursor: pointer;
                            font-weight: bold;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                          `;
                          
                          contentDiv.appendChild(title);
                          contentDiv.appendChild(message);
                          contentDiv.appendChild(okButton);
                          popup.appendChild(contentDiv);
                          document.body.appendChild(popup);
                          
                          okButton.onclick = () => {
                            document.body.removeChild(popup);
                          };
                          
                          // Auto close after 3 seconds
                          setTimeout(() => {
                            if (document.body.contains(popup)) {
                              document.body.removeChild(popup);
                            }
                          }, 3000);
                        };
                        
                        showSuccessPopup();
                      }} variant="destructive" className="bg-red-600 hover:bg-red-700">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear Guidelines
                      </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Drawing Toolbar - Only show in guidelines mode */}
                  {fieldMode === 'guidelines' && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm text-muted-foreground">Tool:</span>
                      <Button size="sm" variant={tool==='arrow'?'default':'outline'} onClick={() => setTool('arrow')}>Arrow</Button>
                      <Button size="sm" variant={tool==='dottedArrow'?'default':'outline'} onClick={() => setTool('dottedArrow')}>Dotted Arrow</Button>
                      <Button size="sm" variant={tool==='line'?'default':'outline'} onClick={() => setTool('line')}>Line</Button>
                      <span className="ml-4 text-sm text-muted-foreground">Color:</span>
                      <button onClick={() => setStroke('#000000')} className={`w-6 h-6 rounded-full border ${stroke==='#000000'?'ring-2 ring-black':''}`} style={{background:'#000000'}} />
                      <button onClick={() => setStroke('#ef4444')} className={`w-6 h-6 rounded-full border ${stroke==='#ef4444'?'ring-2 ring-black':''}`} style={{background:'#ef4444'}} />
                      <button onClick={() => setStroke('#f59e0b')} className={`w-6 h-6 rounded-full border ${stroke==='#f59e0b'?'ring-2 ring-black':''}`} style={{background:'#f59e0b'}} />
                    </div>
                  )}
                  
                  {/* Baseball Field */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div 
                      id="admin-field"
                      className="relative rounded-lg overflow-hidden mx-auto"
                      style={{ 
                        height: '750px',
                        width: '1000px',
                        maxWidth: '100%',
                        backgroundImage: 'url(/images/Baseball_Field.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: '#22c55e'
                      }}
                      onMouseMove={handleAdminMouseMove}
                      onMouseUp={handleAdminMouseUp}
                      ref={fieldContainerRef}
                    >
                      {/* Players - Show in all modes but only allow dragging in positions and correctPositions mode */}
                      {Object.entries(positions).map(([key, pos]) => (
                        <div
                          key={key}
                          className={`absolute w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform select-none ${
                            fieldMode === 'positions'
                              ? 'cursor-move' 
                              : fieldMode === 'correctPositions'
                              ? 'cursor-pointer'
                              : 'cursor-default'
                          } ${
                            adminDragging === key ? 'scale-110 shadow-2xl' : 'hover:scale-110'
                          } ${
                            fieldMode === 'correctPositions' && selectedPlayerForCorrectPos === key ? 'ring-4 ring-blue-500' : ''
                          }`}
                          style={{
                            left: `calc(${pos.x}% - 16px)`,
                            top: `calc(${pos.y}% - 16px)`,
                            zIndex: adminDragging === key ? 50 : 10
                          }}
                          onMouseDown={(e) => handleAdminMouseDown(key, e)}
                        >
                          {/* Player Image */}
                          <img 
                            src={`/images/players/${key.toLowerCase()}.png`}
                            alt={`${pos.label} Player`}
                            className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                            onError={(e) => {
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
                        </div>
                      ))}
                      {/* Guidelines Canvas - Allow drawing in guidelines and correctPositions mode */}
                      <Stage
                        width={fieldContainerRef.current ? fieldContainerRef.current.clientWidth : 0}
                        height={fieldContainerRef.current ? fieldContainerRef.current.clientHeight : 0}
                        className="absolute inset-0"
                        onMouseDown={(e) => {
                          // Allow drawing in guidelines mode
                          if (fieldMode === 'guidelines') {
                            setIsDrawing(true);
                            const container = fieldContainerRef.current;
                            if (!container) return;
                            const rect = container.getBoundingClientRect();
                            const pos = e.evt;
                            const x = ((pos.clientX - rect.left) / rect.width) * 100;
                            const y = ((pos.clientY - rect.top) / rect.height) * 100;
                            setTempPoints([x, y]);
                          }
                          // Allow drawing in correctPositions mode if player is selected
                          else if (fieldMode === 'correctPositions' && selectedPlayerForCorrectPos) {
                            setIsDrawing(true);
                            const container = fieldContainerRef.current;
                            if (!container) return;
                            const rect = container.getBoundingClientRect();
                            const pos = e.evt;
                            const x = ((pos.clientX - rect.left) / rect.width) * 100;
                            const y = ((pos.clientY - rect.top) / rect.height) * 100;
                            // Start arrow from player's current position
                            const playerPos = positions[selectedPlayerForCorrectPos];
                            setTempPoints([playerPos.x, playerPos.y, x, y]);
                          }
                        }}
                        onMouseMove={(e) => {
                          if (!isDrawing) return;
                          const container = fieldContainerRef.current;
                          if (!container) return;
                          const rect = container.getBoundingClientRect();
                          const pos = e.evt;
                          const x = ((pos.clientX - rect.left) / rect.width) * 100;
                          const y = ((pos.clientY - rect.top) / rect.height) * 100;
                          
                          if (fieldMode === 'guidelines') {
                            setTempPoints((pts) => pts.length>=2 ? [pts[0], pts[1], x, y] : [x,y]);
                          } else if (fieldMode === 'correctPositions' && selectedPlayerForCorrectPos) {
                            // Update arrow end point
                            const playerPos = positions[selectedPlayerForCorrectPos];
                            setTempPoints([playerPos.x, playerPos.y, x, y]);
                          }
                        }}
                        onMouseUp={() => {
                          if (!isDrawing) return;
                          
                          if (fieldMode === 'guidelines') {
                            if (tempPoints.length >= 4) {
                              const id = `${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
                              setShapes(prev => [...prev, { id, type: tool, points: tempPoints, stroke, strokeWidth: 3 }]);
                            }
                          } else if (fieldMode === 'correctPositions' && selectedPlayerForCorrectPos && tempPoints.length >= 4) {
                            // Save arrow with circle at end
                            const circleCenter = { x: tempPoints[2], y: tempPoints[3] };
                            setCorrectPositionShapes(prev => {
                              // Remove existing shape for this player if any
                              const filtered = prev.filter(s => s.playerKey !== selectedPlayerForCorrectPos);
                              return [...filtered, {
                                playerKey: selectedPlayerForCorrectPos,
                                arrowPoints: tempPoints,
                                circleCenter: circleCenter
                              }];
                            });
                            setSelectedPlayerForCorrectPos(null); // Reset selection
                          }
                          
                          setIsDrawing(false);
                          setTempPoints([]);
                        }}
                      >
                        <Layer>
                          {/* Show guidelines in guidelines mode */}
                          {fieldMode === 'guidelines' && shapes.map(s => (
                            s.type === 'arrow' ? (
                              <KonvaArrow key={s.id} points={toPixels(s.points, fieldContainerRef)} stroke={s.stroke} fill={s.stroke} strokeWidth={s.strokeWidth || 3} pointerLength={12} pointerWidth={12} />
                            ) : s.type === 'dottedArrow' ? (
                              <KonvaArrow key={s.id} points={toPixels(s.points, fieldContainerRef)} stroke={s.stroke} fill={s.stroke} strokeWidth={s.strokeWidth || 3} pointerLength={12} pointerWidth={12} dash={[10, 5]} />
                            ) : (
                              <KonvaLine key={s.id} points={toPixels(s.points, fieldContainerRef)} stroke={s.stroke} strokeWidth={s.strokeWidth || 3} />
                            )
                          ))}
                          {fieldMode === 'guidelines' && isDrawing && tempPoints.length>=4 && (
                            tool === 'arrow' ? (
                              <KonvaArrow points={toPixels(tempPoints, fieldContainerRef)} stroke={stroke} fill={stroke} strokeWidth={3} pointerLength={12} pointerWidth={12} />
                            ) : tool === 'dottedArrow' ? (
                              <KonvaArrow points={toPixels(tempPoints, fieldContainerRef)} stroke={stroke} fill={stroke} strokeWidth={3} pointerLength={12} pointerWidth={12} dash={[10, 5]} />
                            ) : (
                              <KonvaLine points={toPixels(tempPoints, fieldContainerRef)} stroke={stroke} strokeWidth={3} />
                            )
                          )}
                          
                          {/* Show correct position arrows and circles in correctPositions mode */}
                          {fieldMode === 'correctPositions' && correctPositionShapes.map((shape, idx) => {
                            const pixelPoints = toPixels(shape.arrowPoints, fieldContainerRef);
                            const circlePixels = toPixels([shape.circleCenter.x, shape.circleCenter.y], fieldContainerRef);
                            return [
                              <KonvaArrow 
                                key={`arrow-${shape.playerKey || idx}`}
                                points={pixelPoints} 
                                stroke="#000000" 
                                fill="#000000" 
                                strokeWidth={3} 
                                pointerLength={12} 
                                pointerWidth={12} 
                              />,
                              circlePixels.length >= 2 && (
                                <KonvaCircle
                                  key={`circle-${shape.playerKey || idx}`}
                                  x={circlePixels[0]}
                                  y={circlePixels[1]}
                                  radius={15}
                                  fill="#10b981"
                                  stroke="#000000"
                                  strokeWidth={2}
                                />
                              )
                            ];
                          })}
                          {/* Show temporary arrow while drawing in correctPositions mode */}
                          {fieldMode === 'correctPositions' && isDrawing && tempPoints.length >= 4 && selectedPlayerForCorrectPos && (() => {
                            const arrowPixels = toPixels(tempPoints, fieldContainerRef);
                            const circlePixels = toPixels([tempPoints[2], tempPoints[3]], fieldContainerRef);
                            return (
                              <>
                                <KonvaArrow 
                                  points={arrowPixels} 
                                  stroke="#000000" 
                                  fill="#000000" 
                                  strokeWidth={3} 
                                  pointerLength={12} 
                                  pointerWidth={12} 
                                />
                                {circlePixels.length >= 2 && (
                                  <KonvaCircle
                                    x={circlePixels[0]}
                                    y={circlePixels[1]}
                                    radius={15}
                                    fill="#10b981"
                                    stroke="#000000"
                                    strokeWidth={2}
                                  />
                                )}
                              </>
                            );
                          })()}
                        </Layer>
                      </Stage>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="glass-panel rounded-2xl p-4 border border-white/20">
                  <h3 className="font-semibold text-foreground mb-3">Instructions</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {fieldMode === 'positions' ? (
                      <>
                        <p>• Drag players to set their positions for the selected scenario</p>
                        <p>• Click "Save Positions" to send positions to all users</p>
                        <p>• Users will see these positions when they open the training screen</p>
                        <p>• Click "Clear" to remove admin-set positions and allow normal gameplay</p>
                      </>
                    ) : fieldMode === 'correctPositions' ? (
                      <>
                        <p>• Click on a player to select it, then draw an arrow from the player to the correct position</p>
                        <p>• A green circle will appear at the end of the arrow - that's the correct position</p>
                        <p>• Click "Save Correct Positions" to save these as the answer key</p>
                        <p>• Users will be validated against these positions when they move players</p>
                        <p>• Click "Clear Correct Positions" to remove saved correct positions</p>
                      </>
                    ) : (
                      <>
                        <p>• Use drawing tools to create guidelines on the field</p>
                        <p>• Click and drag to draw arrows or lines</p>
                        <p>• Choose different colors and line styles</p>
                        <p>• Click "Save Guidelines" to save and show to users</p>
                        <p>• Click "Clear Guidelines" to remove all guidelines</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="p-6">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">Platform Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure platform settings, permissions, and preferences
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <Input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Enter username"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password"
                    required
                    minLength={6}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="user">User</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creatingUser}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700"
                  >
                    {creatingUser ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setEditUserData({ username: '', email: '', role: 'user' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <Input
                    type="text"
                    value={editUserData.username}
                    onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                    placeholder="Enter username"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({...editUserData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="user">User</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                      setEditUserData({ username: '', email: '', role: 'user' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update User
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Create/Edit Modal */}
      {showScenarioModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingScenario ? 'Edit Scenario' : 'Create New Scenario'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowScenarioModal(false);
                  setEditingScenario(null);
                  setScenarioForm({ name: '', description: '', icon: '⚾' });
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (editingScenario) {
                    // Update scenario
                    await axios.put(`/admin/scenarios/${editingScenario._id}`, scenarioForm);
                  } else {
                    // Create scenario
                    await axios.post('/admin/scenarios', scenarioForm);
                  }
                  await fetchScenarios();
                  setShowScenarioModal(false);
                  setEditingScenario(null);
                  setScenarioForm({ name: '', description: '', icon: '⚾' });
                  
                  // Show success message
                  alert(editingScenario ? 'Scenario updated successfully!' : 'Scenario created successfully!');
                } catch (error) {
                  alert('Error: ' + (error.response?.data?.error || error.message));
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scenario Name *
                </label>
                <Input
                  type="text"
                  value={scenarioForm.name}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, name: e.target.value })}
                  placeholder="e.g., Fly ball to LF"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  type="text"
                  value={scenarioForm.description}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, description: e.target.value })}
                  placeholder="Brief description of the scenario"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji)
                </label>
                <Input
                  type="text"
                  value={scenarioForm.icon}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, icon: e.target.value })}
                  placeholder="⚾"
                  className="w-full"
                  maxLength={2}
                />
                <p className="text-xs text-gray-500 mt-1">Enter an emoji (e.g., ⚾, 🏟️, 🏃)</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowScenarioModal(false);
                    setEditingScenario(null);
                    setScenarioForm({ name: '', description: '', icon: '⚾' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingScenario ? 'Update Scenario' : 'Create Scenario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
