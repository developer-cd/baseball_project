import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Building2, Users } from "lucide-react";
import api from "../api/axios";

export default function CoachSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    accountType: "individual", // 'individual' | 'organization'
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("❌ Password must be at least 6 characters long!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        organizationName: formData.organizationName.trim(),
        accountType: formData.accountType,
      };

      const res = await api.post("/auth/register/coach", payload);

      if (res.data.success && res.data.checkoutUrl) {
        setMessage("✅ Redirecting to secure payment...");
        // Redirect to Stripe Checkout
        window.location.href = res.data.checkoutUrl;
      } else {
        setMessage("❌ Unexpected response from server");
      }
    } catch (err) {
      setMessage(
        "❌ " + (err.response?.data?.message || "Coach registration failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 px-4 py-10 min-h-screen">
      <div className="w-full max-w-6xl bg-white shadow-2xl rounded-3xl overflow-hidden grid md:grid-cols-2">
        {/* Left side - Image / Info */}
        <div className="relative hidden md:block">
          <img
            src="https://img.freepik.com/free-vector/gradient-softball-background_23-2150742153.jpg?semt=ais_hybrid&w=740&q=80"
            alt="Baseball"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-8 left-6 right-6 text-white">
            <p className="text-sm uppercase tracking-widest mb-2">
              Coach Platform
            </p>
            <h2 className="text-3xl font-bold mb-3">
              Build and manage your defensive teams
            </h2>
            <p className="text-sm text-gray-100">
              Create teams, invite players, and track their defensive training
              progress—all in one place.
            </p>
          </div>
          <div className="absolute top-6 left-6 flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              ⚾
            </div>
            <div>
              <h2 className="font-bold">FieldIQ Coaches</h2>
              <p className="text-xs">Coach & Organization Onboarding</p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Coach Signup
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Create your coach account to set up teams and manage players.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="flex items-center border rounded-lg px-3 border-gray-300">
                <User className="text-gray-400" size={20} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Coach Username"
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
                  placeholder="Coach Email Address"
                  className="w-full px-3 py-2 focus:outline-none"
                  required
                />
              </div>

              {/* Organization Name */}
              <div className="flex items-center border rounded-lg px-3 border-gray-300">
                <Building2 className="text-gray-400" size={20} />
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="Organization / Team Name (optional)"
                  className="w-full px-3 py-2 focus:outline-none"
                />
              </div>

              {/* Account Type */}
              <div className="border rounded-lg px-4 py-3 border-gray-300">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users size={16} className="text-gray-500" />
                  Account Type
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, accountType: "individual" })
                    }
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      formData.accountType === "individual"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-gray-50 text-gray-700 border-gray-300"
                    }`}
                  >
                    Individual Team
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, accountType: "organization" })
                    }
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      formData.accountType === "organization"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-gray-50 text-gray-700 border-gray-300"
                    }`}
                  >
                    Organization
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  You can start with a single team and add more teams later.
                  Pricing adjusts automatically based on team count.
                </p>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center border rounded-lg px-3 border-gray-300">
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
                <div className="flex items-center border rounded-lg px-3 border-gray-300">
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
                {loading ? "Creating Coach Account..." : "Create Coach Account"}
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


