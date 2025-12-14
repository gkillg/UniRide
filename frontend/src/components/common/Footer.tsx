import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 py-10 mt-auto border-t border-[#bda06d]">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
                <h4 className="text-white font-bold uppercase mb-4 tracking-wider">UniRide</h4>
                <p>Official student and staff carpooling platform. Sustainable transportation for our community.</p>
            </div>
            <div>
                <h4 className="text-white font-bold uppercase mb-4 tracking-wider">Contact Us</h4>
                <p><i className="fas fa-map-marker-alt mr-2 text-[#bda06d]"></i> 100 Tole Bi Street, Almaty, Kazakhstan</p>
                <p className="mt-2"><i className="fas fa-phone mr-2 text-[#bda06d]"></i> +7 (727) 293-52-92</p>
                <p className="mt-2"><i className="fas fa-envelope mr-2 text-[#bda06d]"></i> info@atu.edu.kz</p>
            </div>
            <div>
                 <h4 className="text-white font-bold uppercase mb-4 tracking-wider">Quick Links</h4>
                 <ul className="space-y-2">
                     <li><a href="#" className="hover:text-[#bda06d] transition">University Website</a></li>
                     <li><a href="#" className="hover:text-[#bda06d] transition">Student Portal</a></li>
                     <li><a href="#" className="hover:text-[#bda06d] transition">Academic Calendar</a></li>
                 </ul>
            </div>
        </div>
        <div className="text-center mt-8 pt-8 border-t border-gray-800 text-xs text-gray-600">
            &copy; {new Date().getFullYear()} UniRide. All rights reserved.
        </div>
    </footer>
  );
};

export default Footer;