import { useNavigate } from "react-router-dom";
import { CoachDashboard } from "../components/CoachDashboard";

export default function CoachDashboardPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <CoachDashboard onBack={handleBack} />
  );
}
