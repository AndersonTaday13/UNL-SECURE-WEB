import React from "react";
import icons from "../assets/icons.png";

export const Header = () => (
  <div className="flex justify-between items-center p-4">
    <div className="flex-1" />
    <h1 className="text-xl font-semibold text-center flex-1">SecureWeb</h1>
    <div className="flex-1 flex justify-end">
      <img
        src={icons}
        alt="SecureWeb Logo"
        className="w-14 h-14 rounded-lg shadow-sm"
      />
    </div>
  </div>
);
