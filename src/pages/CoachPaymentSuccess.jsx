import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function CoachPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Payment Successful 🎉
        </h1>
        <p className="text-gray-600 mb-2">
          Thank you! Your coach subscription is now active.
        </p>
        <p className="text-gray-600 mb-6">
          You can now log in using the email and password you used during
          signup.
        </p>
        {sessionId && (
          <p className="text-xs text-gray-400 mb-4">
            Reference ID: <span className="font-mono break-all">{sessionId}</span>
          </p>
        )}
        <p className="text-sm text-gray-500">
          Redirecting you to the login page in a few seconds...
        </p>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Go to Login now
        </button>
      </div>
    </div>
  );
}




