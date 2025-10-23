import { useState } from "react";
import { User, Mail, Phone, Lock, Calendar, MapPin } from "lucide-react";
import api from "../api/axios"; 
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dob: "",
    gender: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = { ...formData };
      delete payload.confirmPassword;

      const res = await api.post("/auth/register", payload);

      setMessage("✅ " + res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1000);

      setFormData({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        dob: "",
        gender: "",
        address: "",
      });
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Create Account</h2>
            <p className="text-gray-600 mb-8 text-center">
              Join BaseballPro and start your training journey
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="flex items-center border rounded-lg px-3  border-gray-300">
                <User className="text-gray-400 " size={15} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 focus:outline-none"
                  required
                />
              </div>

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

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
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
                <div className="flex items-center border rounded-lg px-3  border-gray-300">
                  <Phone className="text-gray-400" size={20} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 focus:outline-none"
                    required
                  />
                </div>
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
                    placeholder="Password"
                    className="w-full px-3 py-2 focus:outline-none"
                    required
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
                  />
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                <div className="flex items-center border rounded-lg px-3  border-gray-300">
                  <Calendar className="text-gray-400" size={20} />
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-3 py-2 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex items-center border rounded-lg px-3  border-gray-300">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 focus:outline-none"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start border rounded-lg px-3  border-gray-300">
                <MapPin className="text-gray-400 mt-3" size={20} />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address"
                  rows="2"
                  className="w-full px-3 py-2 focus:outline-none resize-none"
                />
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
