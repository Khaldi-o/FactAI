import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import homeIcon from "../icons/home1.svg";
import appIcon from "../icons/app.svg";
import profileIcon from "../icons/profile.svg";
import logo from "../assets/logo.png";

function Sidebar() {
  const location = useLocation();

  return (
    <div className="sidebar">
      <img src={logo} alt="Logo" className="sidebar-logo" />
      <Link
        to="/"
        className={`sidebar-link ${location.pathname === "/" ? "active" : ""}`}
      >
        <img src={homeIcon} alt="Accueil" className="sidebar-icon" />
        <span>Accueil</span>
      </Link>
      <Link
        to="/app"
        className={`sidebar-link ${
          location.pathname === "/app" ? "active" : ""
        }`}
      >
        <img src={appIcon} alt="Application" className="sidebar-icon" />
        <span>FactAI</span>
      </Link>
      <Link
        to="/profile"
        className={`sidebar-link ${
          location.pathname === "/profile" ? "active" : ""
        }`}
      >
        <img src={profileIcon} alt="Profil" className="sidebar-icon" />
        <span>Profil</span>
      </Link>
    </div>
  );
}

export default Sidebar;
