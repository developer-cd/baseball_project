import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "../components/AdminDashboard";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleViewCoachDashboard = () => {
    // Navigate to coach dashboard or home
    navigate("/home");
  };

  return (
    <AdminDashboard 
      onBack={handleBack}
      onViewCoachDashboard={handleViewCoachDashboard}
    />
  );
}
