import React, { useState, useEffect } from 'react';
import { CheckCircle, Star, MapPin } from 'lucide-react';

const SocialProof = () => {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const notifications = [
    { name: "Grand Hyatt", location: "Melbourne CBD", action: "requested a quote", time: "2 mins ago" },
    { name: "Quest Apartments", location: "South Yarra", action: "signed a contract", time: "15 mins ago" },
    { name: "Novotel", location: "Glen Waverley", action: "requested a callback", time: "32 mins ago" },
    { name: "Boutique Hotel", location: "St Kilda", action: "booked a site visit", time: "1 hour ago" },
    { name: "Student Living Co", location: "Carlton", action: "extended their contract", time: "2 hours ago" },
  ];

  useEffect(() => {
    // Show notification every 8 seconds
    const showTimer = setInterval(() => {
      setIsVisible(true);
      setCurrentNotification(prev => (prev + 1) % notifications.length);
      
      // Hide after 5 seconds
      setTimeout(() => setIsVisible(false), 5000);
    }, 8000);

    // Show first notification after 3 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 5000);
    }, 3000);

    return () => {
      clearInterval(showTimer);
      clearTimeout(initialTimer);
    };
  }, []);

  const notification = notifications[currentNotification];

  return (
    <div 
      className={`fixed bottom-24 left-6 z-30 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl p-4 max-w-xs border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-gray-800 text-sm">
              <span className="font-semibold">{notification.name}</span>
              {' '}{notification.action}
            </p>
            <p className="text-gray-500 text-xs flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {notification.location}
              </span>
              <span>•</span>
              <span>{notification.time}</span>
            </p>
          </div>
        </div>
        
        {/* Stars */}
        <div className="flex gap-0.5 mt-2 ml-13">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialProof;
