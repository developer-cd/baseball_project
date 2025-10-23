import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight } from 'lucide-react';

const BrowseSituations = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');

  const categories = ['All', 'Standard Defense', 'Special Plays', 'Runners On Base'];
  const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

  const situations = [
    {
      id: 1,
      title: 'Standard Defense - 0 Outs',
      difficulty: 'Beginner',
      category: 'Standard Defense',
      description: 'Basic defensive positioning with no runners on base, no outs',
      outs: 0,
      responsibilities: [
        'P: Field bunts and comebackers, cover first base on balls...',
        'C: Receive pitch, cover home plate, back up first base on...',
        '1B: Hold the runner, field ground balls, cover first base'
      ]
    },
    {
      id: 2,
      title: 'Standard Defense - 1 Out',
      difficulty: 'Beginner',
      category: 'Standard Defense',
      description: 'Basic defensive positioning with no runners on base, 1 out',
      outs: 1,
      responsibilities: [
        'P: Field bunts and comebackers, cover first base on balls...',
        'C: Receive pitch, cover home plate, back up first base on...',
        '1B: Hold the runner, field ground balls, cover first base'
      ]
    },
    {
      id: 3,
      title: 'Standard Defense - 2 Outs',
      difficulty: 'Beginner',
      category: 'Standard Defense',
      description: 'Basic defensive positioning with no runners on base, 2 outs',
      outs: 2,
      responsibilities: [
        'P: Field bunts and comebackers, cover first base on balls...',
        'C: Receive pitch, cover home plate, back up first base on...',
        '1B: Hold the runner, field ground balls, cover first base'
      ]
    }
  ];

  const filteredSituations = situations.filter(situation => {
    const matchesSearch = situation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         situation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || situation.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All Levels' || situation.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="mr-2">←</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Situations</h1>
              <p className="text-sm text-gray-500 mt-1">Explore 57 defensive scenarios</p>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
              <span className="text-sm font-medium text-gray-900">5 Categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Search and Category Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search situations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>

            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Difficulty:</span>
            {difficulties.map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedDifficulty === difficulty
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Situations Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSituations.map((situation) => (
            <div key={situation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header with Field Icon */}
              <div className="relative bg-gradient-to-br from-emerald-100 to-emerald-200 p-6">
                <div className="w-16 h-16 bg-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-emerald-100" viewBox="0 0 100 100" fill="none">
                    {/* Baseball diamond */}
                    <path d="M50 70 L65 55 L50 40 L35 55 Z" fill="currentColor" opacity="0.6"/>
                    {/* Bases */}
                    <circle cx="50" cy="70" r="2" fill="white"/>
                    <circle cx="65" cy="55" r="2" fill="white"/>
                    <circle cx="50" cy="40" r="2" fill="white"/>
                    <circle cx="35" cy="55" r="2" fill="white"/>
                    {/* Outfield arc */}
                    <path d="M 25 75 Q 50 20, 75 75" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4"/>
                  </svg>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                    {situation.difficulty}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    {situation.category}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {situation.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  {situation.description}
                </p>

                <div className="mb-4">
                  <span className="text-xs font-medium text-gray-700">Outs: {situation.outs}</span>
                </div>

                {/* Key Responsibilities */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Key Responsibilities:</h4>
                  <ul className="space-y-1">
                    {situation.responsibilities.map((resp, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start">
                        <span className="text-emerald-500 mr-1.5">•</span>
                        <span className="flex-1">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* View Details Button */}
                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowseSituations;