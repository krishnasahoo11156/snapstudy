import { useNav } from "../../context/NavContext";
import LandingPage from "../../pages/LandingPage";
import AuthScreen from "../auth/AuthScreen";
import StudyCanvas from "../canvas/StudyCanvas";
import FolderCanvas from "../canvas/FolderCanvas";
import NotesWorkspace from "../notes/NotesWorkspace";
import CaptureScreen from "../capture/CaptureScreen";

export default function DesktopLayout() {
  const { page } = useNav();

  switch (page) {
    case "landing":   return <LandingPage />;
    case "login":     return <AuthScreen initialMode="signin" />;
    case "signup":    return <AuthScreen initialMode="signup" />;
    case "canvas":    return <StudyCanvas />;
    case "folder":    return <FolderCanvas />;
    case "chapter":   return <FolderCanvas />;
    case "notes":     return <NotesWorkspace />;
    case "capture-image":
    case "capture-file":
      return (
        <div className="flex flex-col h-screen bg-paper">
          <CaptureScreen />
        </div>
      );
    default:          return <LandingPage />;
  }
}
