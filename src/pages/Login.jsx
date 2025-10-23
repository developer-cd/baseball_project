import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
  

export default function Login() {
  const { setUser, login } = useAuth(); 
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const res = await api.post("/auth/login", formData);
    // console.log("Login response:", res.data);

    if (res.data.accessToken) {
      // Login and get the dashboard route
      const dashboardRoute = login(res.data.user, res.data.accessToken, res.data.refreshToken);
      
      // Navigate to the appropriate dashboard
      setTimeout(() => {
        navigate(dashboardRoute, { replace: true });
      }, 100);
    } else {
      setMessage("❌ Invalid response from server");
    }
  } catch (err) {
    setMessage(
      "❌ " + (err.response?.data?.message || err.message || "Invalid credentials")
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="w-full max-w-6xl bg-white shadow-2xl rounded-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left Side */}
        <div className="relative hidden md:block">
          <img
            src="https://img.freepik.com/free-vector/gradient-softball-background_23-2150742153.jpg?semt=ais_hybrid&w=740&q=80"
            alt="Baseball field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-8 left-6 right-6 text-white">
            <blockquote className="text-lg italic font-medium">
              "Champions are made when nobody's watching"
            </blockquote>
            <p className="text-sm mt-2">- Baseball Legend</p>
          </div>
          <div className="absolute top-6 left-6 flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center">
              ⚾
            </div>
            <div>
              <h2 className="font-bold">BaseballPro</h2>
              <p className="text-xs">Training Platform</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-10 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-3xl text-center font-bold text-gray-800 mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-500 mb-6 text-center">
              Sign in to continue your baseball training journey
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-green-400 outline-none"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-green-400 outline-none"
                  required
                />
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-green-600" />{" "}
                  Remember me
                </label>
                <a href="/forgot" className="text-green-600 hover:underline">
                  Forgot Password?
                </a>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {message && (
              <p className="mt-4 text-red-600 text-center">{message}</p>
            )}

            {/* Register Link */}
            <p className="mt-6 text-gray-600 text-center">
              Don’t have an account?{" "}
              <a
                href="/register"
                className="text-green-600 font-semibold hover:underline"
              >
                Create Account
              </a>
            </p>

            {/* Social logins */}
            <div className="mt-8">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200" />
                <span className="px-3 text-gray-400 text-sm">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-gray-200" />
              </div>
             <div className="mt-6 grid grid-cols-2 gap-4">
  {/* Facebook */}
  <button className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 rounded-xl bg-white shadow-sm hover:bg-gray-50 transition">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
      alt="Facebook"
      className="w-5 h-5"
    />
    <span className="text-sm font-medium text-gray-700">Facebook</span>
  </button>

  {/* Google */}
  <button className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 rounded-xl bg-white shadow-sm hover:bg-gray-50 transition">
    <img
      src="https://static.vecteezy.com/system/resources/previews/022/613/027/non_2x/google-icon-logo-symbol-free-png.png"
      alt="Google"
      className="w-5 h-5"
    />
    <span className="text-sm font-medium text-gray-700">Google</span>
  </button>
</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
