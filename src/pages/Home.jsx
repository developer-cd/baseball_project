import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronRight, Users, Target, BookOpen, Code, TrendingUp } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-indigo-100 mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-sm font-medium text-gray-700">Interactive Training Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            ⚾ Baseball Training
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Master your defensive responsibilities in every situation on the baseball field.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Link 
              to="/ground"
              className="flex items-center px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-5 h-5 mr-2" fill="white" />
              Start Learning
            </Link>
            <Link 
              to="/browse"
              className="flex items-center px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 shadow-sm transition-all"
            >
              Browse Situations
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            {/* Scenarios Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">12+</div>
              <div className="text-sm text-gray-600 font-medium">Scenarios</div>
            </div>

            {/* Positions Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">9</div>
              <div className="text-sm text-gray-600 font-medium">Positions</div>
            </div>

            {/* Interactive Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">100%</div>
              <div className="text-sm text-gray-600 font-medium">Interactive</div>
            </div>
          </div>
        </div>
      </div>

      {/* Train Like the Pros Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Train Like the Pros</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              FieldIQ helps coaches and players master defensive responsibilities through interactive learning and testing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Study Guide Card */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-8 w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Study Guide</h3>
                <p className="text-gray-600">
                  Browse and study defensive responsibilities for every position in various game situations.
                </p>
              </div>
            </div>

            {/* Quiz Mode Card */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-8 w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center">
                <Code className="w-8 h-8 text-white" />
              </div>
              <div className="pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quiz Mode</h3>
                <p className="text-gray-600">
                  Test your knowledge of defensive responsibilities with interactive quizzes.
                </p>
              </div>
            </div>

            {/* Progress Tracking Card */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-8 w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Progress Tracking</h3>
                <p className="text-gray-600">
                  Track your learning progress and master every defensive situation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Elevate Section */}
      <div className="bg-gradient-to-r from-green-50 via-white to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to elevate your game?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Start mastering defensive positioning with our interactive field visualizer and comprehensive training modules.
            </p>
            <Link 
              to="/ground"
              className="inline-flex items-center px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-gray-600">© 2024 FieldIQ. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy</Link>
              <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">Terms</Link>
              <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;