import { useNavigate } from "react-router-dom";

export const useAdvancedNavigation = () => {
  const navigate = useNavigate();

  const smartNavigate = (url: string, event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  return { smartNavigate };
};