import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import api from "../api/axios"; 
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(!!token);
  const [coachInfo, setCoachInfo] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  // Validate token on mount if token exists
  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setTokenError("Registration link is required. Please use the link provided by your coach.");
      setValidatingToken(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await api.get(`/auth/register/validate-token/${token}`);
      if (res.data.success && res.data.valid) {
        setCoachInfo(res.data.coach);
        if (res.data.teamInfo.isFull) {
          setTokenError("This coach's team is full. Maximum 15 members allowed.");
        } else {
          setTokenError(null); // Clear any previous errors
        }
      } else {
        setTokenError(res.data?.message || "Invalid registration link");
      }
    } catch (err) {
      console.error('Token validation error:', err);
      const errorMessage = err.response?.data?.message || "Invalid or expired registration link";
      setTokenError(errorMessage);
    } finally {
      setValidatingToken(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setMessage("❌ Registration link is required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("❌ Password must be at least 6 characters long!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        token,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      const res = await api.post("/auth/register/coach-team", payload);

      if (res.data.success) {
        setMessage("✅ " + res.data.message);
        
        // Auto-login the user
        if (res.data.accessToken && res.data.refreshToken && res.data.user) {
          login(res.data.user, res.data.accessToken, res.data.refreshToken);
          
          setTimeout(() => {
            navigate("/home");
          }, 1500);
        } else {
          setTimeout(() => {
            navigate("/login");
          }, 1500);
        }

        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating registration link...</p>
        </div>
      </div>
    );
  }

  if (tokenError && !coachInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Registration Link</h2>
          <p className="text-gray-600 mb-6">{tokenError}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-6xl bg-white shadow-2xl rounded-3xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left side - Image */}
          <div className="relative hidden md:block">
            <img
              src="https://img.freepik.com/free-vector/gradient-softball-background_23-2150742153.jpg?semt=ais_hybrid&w=740&q=80"
              alt="Baseball"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="italic text-lg">
                "Champions are made when nobody's watching"
              </p>
              <span className="text-sm">- Baseball Legend</span>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="p-10 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Join Coach Team</h2>
            {coachInfo && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Users size={20} />
                  <span className="font-semibold">Coach: {coachInfo.username}</span>
                </div>
                <p className="text-sm text-green-600">You're joining {coachInfo.username}'s team</p>
              </div>
            )}
            <p className="text-gray-600 mb-8 text-center">
              Create your account to join the team
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="flex items-center border rounded-lg px-3  border-gray-300">
                <User className="text-gray-400" size={20} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full px-3 py-2 focus:outline-none"
                  required
                />
              </div>

              {/* Email */}
              <div className="flex items-center border rounded-lg px-3 border-gray-300">
                <Mail className="text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full px-3 py-2 focus:outline-none"
                  required
                />
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                <div className="flex items-center border rounded-lg px-3  border-gray-300">
                  <Lock className="text-gray-400" size={20} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password (min 6 characters)"
                    className="w-full px-3 py-2 focus:outline-none"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-center border rounded-lg px-3  border-gray-300">
                  <Lock className="text-gray-400" size={20} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className="w-full px-3 py-2 focus:outline-none"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>

            {message && (
              <p className="mt-4 text-center text-sm font-medium text-red-600">
                {message}
              </p>
            )}

            <p className="mt-6 text-center text-gray-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-600 font-semibold hover:underline"
              >
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
