import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<HomePage />} />
          <Route path="/services" element={<HomePage />} />
          <Route path="/services/*" element={<HomePage />} />
          <Route path="/hospitality" element={<HomePage />} />
          <Route path="/jobs" element={<HomePage />} />
          <Route path="/blog" element={<HomePage />} />
          <Route path="/contact" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
