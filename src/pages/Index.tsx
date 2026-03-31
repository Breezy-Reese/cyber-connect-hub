import { useNavigate } from "react-router-dom";
import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  navigate("/");
  return null;
};

export default Index;
