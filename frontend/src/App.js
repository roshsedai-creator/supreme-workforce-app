import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import IndustriesPage from "./pages/IndustriesPage";
import CareersPage from "./pages/CareersPage";
import ContactPage from "./pages/ContactPage";
import BlogPage from "./pages/BlogPage";
import BlogArticlePage from "./pages/BlogArticlePage";
import QuotePage from "./pages/QuotePage";
import RegisterPage from "./pages/RegisterPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import QualityAssurancePage from "./pages/QualityAssurancePage";
import WorkplacePolicyPage from "./pages/WorkplacePolicyPage";
import SustainabilityPage from "./pages/SustainabilityPage";
import TermsPage from "./pages/TermsPage";
import HealthSafetyPage from "./pages/HealthSafetyPage";
import CommunityPage from "./pages/CommunityPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/industries" element={<IndustriesPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogArticlePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/quote" element={<QuotePage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Legal & Policy Pages */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/quality" element={<QualityAssurancePage />} />
          <Route path="/workplace" element={<WorkplacePolicyPage />} />
          <Route path="/sustainability" element={<SustainabilityPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/safety" element={<HealthSafetyPage />} />
          <Route path="/community" element={<CommunityPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
