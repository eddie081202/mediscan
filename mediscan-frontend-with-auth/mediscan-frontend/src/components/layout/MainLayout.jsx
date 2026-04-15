import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/Layout.css";

export default function MainLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}