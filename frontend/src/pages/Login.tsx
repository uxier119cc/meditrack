import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Lottie from 'lottie-react';
import { Input } from '@/components/ui/input';
import { Lock, User, Stethoscope, ArrowRight, Heart, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { gsap } from 'gsap';
import { useAuth } from '@/contexts/AuthContext';

// Import animation data or provide a fallback
// You should place this file in your assets directory
import walkingAnimation from '@/assets/walkinganimation.json';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Refs for animations
  const wordListRef = useRef(null);
  const selectorRef = useRef(null);
  const formContainerRef = useRef(null);
  const iconContainerRef = useRef(null);
  
  // Medical-related looping words
  const loopingWords = [
    "An Apple a day keeps the doctor away",
    "The greatest wealth is health.",
    "Let food be the medicine and medicine be the food",
    "Laughter is the best medicine",
    "The first wealth is health",
    "Health is not valued till sickness comes  ",
    "A healthy outside starts from the inside",
    "Your body hears everything your mind says.",
    "Diagnosis",
    "Treatment",
    "Wellness"
  ];

  // Check for remembered credentials on page load
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('meditrack-email');
    const wasRemembered = localStorage.getItem('meditrack-remember');
    
    if (rememberedEmail && wasRemembered) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Background icons/elements animation
  useEffect(() => {
    if (!iconContainerRef.current || typeof gsap === 'undefined') return;
    
    try {
      const icons = iconContainerRef.current.children;
      
      for (let i = 0; i < icons.length; i++) {
        const icon = icons[i];
        const delay = i * 0.2;
        const duration = 3 + Math.random() * 2;
        
        // Random position within container
        const xPos = Math.random() * 80 + 10; // 10-90%
        const yPos = Math.random() * 80 + 10; // 10-90%
        
        gsap.set(icon, {
          x: `${xPos}%`,
          y: `${yPos}%`,
          opacity: 0.2 + Math.random() * 0.3,
          scale: 0.8 + Math.random() * 0.4
        });
        
        // Create floating animation
        gsap.to(icon, {
          y: `${yPos + (Math.random() * 10 - 5)}%`,
          x: `${xPos + (Math.random() * 10 - 5)}%`,
          rotation: Math.random() * 20 - 10,
          duration: duration,
          delay: delay,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }
    } catch (error) {
      console.error("Error in icon animation:", error);
    }
  }, []);
  
  // Words animation
  useEffect(() => {
    if (!wordListRef.current || !selectorRef.current || typeof gsap === 'undefined') return;
    
    try {
      const wordList = wordListRef.current;
      const words = Array.from(wordList.children);
      const totalWords = words.length;
      const wordHeight = 100 / totalWords;
      const edgeElement = selectorRef.current;
      let currentIndex = 0;
      
      function updateEdgeWidth() {
        if (!words[currentIndex + 1]) return;
        
        const centerIndex = (currentIndex + 1) % totalWords;
        const centerWord = words[centerIndex] as HTMLElement;
        const centerWordWidth = centerWord.getBoundingClientRect().width;
        const listWidth = wordList.getBoundingClientRect().width;
        const percentageWidth = (centerWordWidth / listWidth) * 100;
        
        gsap.to(edgeElement, {
          width: `${percentageWidth}%`,
          duration: 0.5,
          ease: 'expo.out',
        });
      }
      
      function moveWords() {
        currentIndex++;
        gsap.to(wordList, {
          yPercent: -wordHeight * currentIndex,
          duration: 1.2,
          ease: 'elastic.out(1, 0.85)',
          onStart: updateEdgeWidth,
          onComplete: function() {
            if (currentIndex >= totalWords - 3) {
              if (wordList.firstElementChild) {
                wordList.appendChild(wordList.firstElementChild);
                currentIndex--;
                gsap.set(wordList, { yPercent: -wordHeight * currentIndex });
                words.push(words.shift());
              }
            }
          }
        });
      }
      
      // Initialize edge width
      updateEdgeWidth();
      
      // Create timeline for continuous animation
      const timeline = gsap.timeline({ repeat: -1, delay: 1 });
      timeline.call(moveWords).to({}, { duration: 2 }).repeat(-1);
      
      // Cleanup
      return () => {
        timeline.kill();
      };
    } catch (error) {
      console.error("Error in word animation:", error);
    }
  }, []);
  
  // Form entry animation
  useEffect(() => {
    if (!formContainerRef.current || typeof gsap === 'undefined') return;
    
    try {
      gsap.from(formContainerRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    } catch (error) {
      console.error("Error in form animation:", error);
    }
  }, []);

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Login failed",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Login page: Attempting login with credentials');
      await login(email, password, rememberMe);
      console.log('Login page: Login successful, should redirect');
    } catch (error) {
      // Error is already handled in the login function
      console.error('Login page: Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Brand panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 relative">
        {/* Background medical icons */}
        <div className="absolute inset-0 overflow-hidden opacity-20" ref={iconContainerRef}>
          <Heart className="absolute text-white w-12 h-12" />
          <Activity className="absolute text-white w-12 h-12" />
          <Stethoscope className="absolute text-white w-12 h-12" />
          <div className="absolute w-16 h-16 rounded-full border-4 border-white"></div>
          <div className="absolute w-12 h-12 rounded-lg border-2 border-white"></div>
          <svg className="absolute w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M10 9v6m4-6v6M9 5h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z" />
          </svg>
          <svg className="absolute w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 4v16m-8-8h16" />
          </svg>
          <Heart className="absolute text-white w-10 h-10" />
          <Activity className="absolute text-white w-10 h-10" />
        </div>
        
        {/* Hexagon pattern overlay */}
        <div className="absolute inset-0 bg-opacity-10 backdrop-filter backdrop-blur-sm">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
                  <path d="M25 0 L50 14.4 L50 43.4 L25 57.7 L0 43.4 L0 14.4 Z" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
                <pattern id="plus" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 10,5 L 10,15 M 5,10 L 15,10" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexagons)" />
              <rect width="100%" height="100%" fill="url(#plus)" />
            </svg>
          </div>
        </div>
        
        {/* Branding content */}
        <div className="relative z-10 flex flex-col justify-center items-center px-12 w-full text-white">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20 shadow-lg shadow-blue-900/40">
              <Stethoscope className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-3">MediTrack</h1>
            <p className="text-xl opacity-90 font-light">Advanced Clinical Management System</p>
          </div>
          
          {/* Looping Words Section */}
          <div className="my-10 w-full max-w-md">
            <div className="backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20 shadow-lg shadow-blue-900/20">
              <div className="relative h-16 overflow-hidden">
                <ul ref={wordListRef} className="absolute w-full text-center">
                  {loopingWords.map((word, index) => (
                    <li key={index} className="h-16 flex items-center justify-center">
                      <p className="text-2xl font-semibold">{word}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center mt-4">
                <div ref={selectorRef} className="h-1 bg-white/50 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Animated Pulse Rings */}
          <div className="relative w-full h-36 mt-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-16 h-16 rounded-full bg-white/10 animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute w-24 h-24 rounded-full bg-white/5 animate-ping" style={{ animationDuration: '4s' }}></div>
              <div className="absolute w-32 h-32 rounded-full bg-white/5 animate-ping" style={{ animationDuration: '5s' }}></div>
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center z-10 border border-white/30">
                <span className="text-white font-bold text-xl">MT</span>
              </div>
            </div>
          </div>
          
          {/* Fixed Lottie component - removed semicolon and using imported animation */}
          {walkingAnimation && (
            <Lottie 
              animationData={walkingAnimation} 
              loop={true} 
              autoplay={true} 
              className="w-28 h-28 " 
            />
          )}
          
          <p className="text-white/90 text-center mt-8 text-lg font-light max-w-lg">
            Revolutionizing healthcare management with cutting-edge technology for better patient outcomes
          </p>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-12">
        <div className="w-full max-w-md" ref={formContainerRef}>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Mobile only header */}
            <div className="md:hidden bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center">MediTrack</h1>
              <p className="text-center text-white/80 mt-1">Clinical Management System</p>
            </div>
            
            <form onSubmit={handleLogin} className="p-8 space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-600 mt-2">Sign in to your doctor account</p>
                <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm text-blue-800">
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="email">Email Address</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 h-5 w-5" />
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="doctor@example.com" 
                      className="pl-10 h-12 rounded-xl border-gray-300 focus:ring-blue-600 focus:border-blue-600" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 h-5 w-5" />
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••" 
                      className="pl-10 pr-10 h-12 rounded-xl border-gray-300 focus:ring-blue-600 focus:border-blue-600" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Remember Me checkbox */}
                <div className="flex items-center mt-2">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                  <div className="ml-1 group relative">
                    <span className="text-gray-400 cursor-help text-xs">(?)</span>
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded w-52">
                      Your email will be remembered on this device. Don't use on shared computers.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="h-5 w-5 border-2 border-current border-r-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </div>
                  )}
                </Button>
              </div>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
                >
                  <img src="/api/placeholder/20/20" alt="Google" className="mr-2 h-5 w-5" />
                  Google
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
                >
                  <img src="/api/placeholder/20/20" alt="SSO" className="mr-2 h-5 w-5" />
                  Hospital SSO
                </Button>
              </div>
            </form>
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>MediTrack © 2025 • Secure Medical Platform • <a href="#" className="hover:underline text-blue-600">Privacy Policy</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;