import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, X, Minimize2, Maximize2, MessageCircle, Trash2, RefreshCw, Volume2, ExternalLink } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { chatbotService } from "@/lib/api"

// Import the animation styles
import "@/styles/animations.css"

// Animation styles for typing indicator
const typingAnimationStyles = {
  base: "w-2 h-2 rounded-full bg-current animate-bounce",
  first: "animation-delay-0",
  second: "animation-delay-150",
  third: "animation-delay-300"
}

interface NavigationAction {
  type: string
  target: string
  params?: Record<string, string>
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  navigationAction?: NavigationAction
}

const ChatbotInterface: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversationId, setConversationId] = useState<string>("default-conversation")
  const [isTyping, setIsTyping] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Generate a conversation ID when component mounts
  useEffect(() => {
    setConversationId(`conversation-${Date.now()}`)

    // Detect system theme preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
    }
  }, [])

  // Load initial welcome message
  useEffect(() => {
    if (conversationId) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I am MediTrack Assistant. How can I help you with your medical tracking needs today?",
          timestamp: new Date(),
        },
      ])
    }
  }, [conversationId])

  // Smooth scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  // Set new message indicator when minimized
  useEffect(() => {
    if (isMinimized && messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setHasNewMessage(true)
    }
  }, [isMinimized, messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Display typing indicator
    setIsTyping(true)

    try {
      // Try to use the backend chatbot service
      try {
        const response = await chatbotService.sendMessage(input, conversationId)
        
        setIsTyping(false)

        const assistantMessage: Message = {
          role: "assistant",
          content: response.data.content,
          timestamp: new Date(response.data.timestamp),
          navigationAction: response.data.navigationAction
        }

        setMessages((prev) => [...prev, assistantMessage])
        
        // Handle navigation action if present
        if (assistantMessage.navigationAction) {
          handleNavigation(assistantMessage.navigationAction)
        }
      } catch (apiError) {
        // Fallback to local response generation if API fails
        console.warn("API error, falling back to local response:", apiError)
        const fallbackResponse = generateResponse(input)
        
        setIsTyping(false)
        
        const fallbackMessage: Message = {
          role: "assistant",
          content: fallbackResponse,
          timestamp: new Date(),
        }
        
        setMessages((prev) => [...prev, fallbackMessage])
      }
    } catch (error) {
      console.error("Error in message handling:", error)

      setIsTyping(false)

      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle navigation actions from the chatbot
  const handleNavigation = (navigationAction: NavigationAction) => {
    if (!navigationAction || !navigationAction.type || !navigationAction.target) {
      return
    }
    
    // Map navigation targets to actual routes
    const routeMap: Record<string, string> = {
      dashboard: "/dashboard",
      patients: "/patients",
      patientDetails: "/patients", // Will need patient ID parameter
      prescriptions: "/patients", // Will need patient ID parameter
      labReports: "/patients", // Will need patient ID parameter
      vitalsAnalytics: "/patients", // Will need patient ID parameter
      appointments: "/appointments",
      profile: "/profile",
      settings: "/settings",
      help: "/help"
    }
    
    const route = routeMap[navigationAction.target]
    if (!route) return
    
    // For patient-specific routes, we need to check if we're already on a patient page
    if (['patientDetails', 'prescriptions', 'labReports', 'vitalsAnalytics'].includes(navigationAction.target)) {
      // Extract patient ID from current URL if we're on a patient page
      const patientIdMatch = location.pathname.match(/\/patients\/([^\/]+)/);
      const patientId = patientIdMatch ? patientIdMatch[1] : null;
      
      if (patientId) {
        // If we have a patient ID, navigate to the specific tab
        let targetTab = '';
        switch (navigationAction.target) {
          case 'patientDetails':
            targetTab = ''; // Default tab
            break;
          case 'prescriptions':
            targetTab = '?tab=prescriptions';
            break;
          case 'labReports':
            targetTab = '?tab=lab-reports';
            break;
          case 'vitalsAnalytics':
            targetTab = '?tab=vitals-analytics';
            break;
        }
        
        // Navigate to the patient page with the specific tab
        setTimeout(() => {
          navigate(`/patients/${patientId}${targetTab}`);
        }, 1000); // Delay to allow user to read the response
      } else {
        // If we don't have a patient ID, just navigate to the patients list
        setTimeout(() => {
          navigate('/patients');
        }, 1000);
      }
    } else {
      // For non-patient routes, navigate directly
      setTimeout(() => {
        navigate(route);
      }, 1000); // Delay to allow user to read the response
    }
  };

  // Simple rule-based response generation (fallback when API fails)
  const generateResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    // Greetings
    if (/^(hi|hello|hey|greetings)/i.test(lowerMessage)) {
      return "Hello! How can I assist you with this patient's medical information today?";
    }

    // Patient information
    if (
      lowerMessage.includes("patient") &&
      (lowerMessage.includes("information") || lowerMessage.includes("details"))
    ) {
      return "You can view comprehensive patient information in the Patient Overview card. This includes contact details, demographics, and key vitals. For more detailed medical history, check the Medical History card. Would you like me to explain any specific section in more detail?";
    }

    // Vitals
    if (
      lowerMessage.includes("vital") ||
      lowerMessage.includes("bp") ||
      lowerMessage.includes("blood pressure") ||
      lowerMessage.includes("heart rate")
    ) {
      return "Patient vitals are displayed in the Vitals tab. You can view individual readings or switch to the Vitals Analytics tab to see trends over time with our interactive charts. The system automatically flags abnormal values and provides reference ranges for quick clinical assessment. Would you like me to explain how to interpret these charts?";
    }

    // Prescriptions
    if (
      lowerMessage.includes("prescription") ||
      lowerMessage.includes("medication") ||
      lowerMessage.includes("medicine")
    ) {
      return "You can manage prescriptions from the Prescriptions tab. To create a new prescription, click the 'New Prescription' button at the top of the page. You can also refill or export existing prescriptions using the buttons on each prescription card. The system maintains a complete medication history for reference during follow-up visits.";
    }

    // Lab reports
    if (lowerMessage.includes("lab") || lowerMessage.includes("test") || lowerMessage.includes("report")) {
      return "Lab reports are available in the Lab Reports tab. You can view detailed test results, including parameter values and their status (normal, abnormal, or critical). The system automatically highlights values outside reference ranges. To add a new lab report, click the 'Add Lab Report' button at the top of the tab.";
    }

    // Charts and analytics
    if (
      lowerMessage.includes("chart") ||
      lowerMessage.includes("graph") ||
      lowerMessage.includes("analytics") ||
      lowerMessage.includes("trend")
    ) {
      return "The Vitals Analytics tab provides interactive charts that visualize patient health trends over time. These charts include reference ranges and automatic flagging of abnormal values. You can hover over data points for detailed information and compare against population averages. This visualization helps identify patterns that might not be apparent from individual readings.";
    }

    // Medical history
    if (lowerMessage.includes("history") || lowerMessage.includes("condition") || lowerMessage.includes("allergy")) {
      return "The patient's medical history, including conditions and allergies, is displayed in the Medical History card on the left side of the screen. This information is crucial for clinical decision-making and avoiding adverse reactions. The system highlights critical allergies in red for immediate visibility during prescribing.";
    }

    // Diagnosis questions
    if (lowerMessage.includes("diagnos") || lowerMessage.includes("condition") || lowerMessage.includes("assessment")) {
      return "The patient's diagnoses are recorded in their prescriptions and visit notes. You can view the most recent diagnosis in the Prescriptions tab. For a comprehensive view of the patient's condition progression, review the notes in each visit record under the Vitals tab. Would you like guidance on adding a new diagnosis?";
    }

    // Treatment plans
    if (lowerMessage.includes("treatment") || lowerMessage.includes("plan") || lowerMessage.includes("care")) {
      return "Treatment plans can be documented in the prescription notes and follow-up instructions. When creating a new prescription, use the 'Special Instructions' and 'Follow-up' fields to outline the care plan. You can also add detailed notes during each visit record to track the patient's progress against the treatment plan.";
    }

    // Help with the interface
    if (lowerMessage.includes("help") || lowerMessage.includes("how to") || lowerMessage.includes("guide")) {
      return "The patient details page is organized into several sections: Patient Overview and Medical History cards on the left, and tabbed content for Prescriptions, Vitals, Vitals Analytics, and Lab Reports on the right. Use the tabs to navigate between different types of information. Buttons at the top allow you to add new prescriptions and lab reports. Is there a specific feature you need help with?";
    }

    // Default response
    return "I'm here to help you navigate this patient's medical information. You can ask me about patient details, vitals, prescriptions, lab reports, or how to use specific features of the interface. For clinical decision support, I can provide reference information but always defer to your professional judgment.";
  }

  const handleClearConversation = () => {
    setMessages([
      {
        role: "assistant",
        content: "Conversation cleared. How can I help you with your medical tracking today?",
        timestamp: new Date(),
      },
    ])
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
      setHasNewMessage(false)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    if (!isMinimized) {
      setHasNewMessage(false)
    }
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const messageDate = new Date(date)

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today"
    } else if (messageDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString()) {
      return "Yesterday"
    } else {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(messageDate)
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = formatDate(new Date(message.timestamp))
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
      return groups
    },
    {} as Record<string, Message[]>,
  )

  const speakMessage = (content: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(content)
      utterance.rate = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-4 right-4 rounded-full p-4 shadow-lg flex items-center justify-center z-50",
          "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700",
          hasNewMessage && "animate-pulse",
        )}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="h-6 w-6" />
        {hasNewMessage && <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">1</Badge>}
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "fixed bottom-4 right-4 shadow-xl transition-all duration-300 ease-in-out z-50",
          "border-primary/20 backdrop-blur-sm",
          isMinimized ? "w-64 h-16" : "w-96 h-[600px]",
          theme === "dark" ? "bg-gray-900/95 text-white" : "bg-white/95",
        )}
      >
        <CardHeader
          className={cn(
            "p-3 flex flex-row items-center justify-between space-y-0 border-b",
            theme === "dark" ? "border-gray-700" : "border-gray-200",
            "bg-gradient-to-r from-blue-50/90 to-indigo-50/90",
          )}
        >
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2 ring-2 ring-primary/30">
              <AvatarImage src="/logo.png" alt="MediTrack" />
              <AvatarFallback className="bg-blue-600 text-white">MD</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-medium">MediTrack Assistant</CardTitle>
              {!isMinimized && (
                <div className="text-xs opacity-70 flex items-center">
                  <span className={cn("w-2 h-2 rounded-full mr-1", isLoading ? "bg-amber-500" : "bg-green-500")}></span>
                  {isLoading ? "Processing..." : "Online"}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {!isMinimized && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                  >
                    {theme === "dark" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMinimize}
                  className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMinimized ? "Expand" : "Minimize"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0 flex-grow relative">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4 text-center text-gray-500">
                  <div>
                    <div className="mb-4 flex justify-center">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src="/logo.png" alt="MediTrack" />
                        <AvatarFallback className="bg-primary/10 text-primary">MT</AvatarFallback>
                      </Avatar>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Welcome to MediTrack Assistant</h3>
                    <p className="text-sm">Ask me anything about your medical tracking needs!</p>
                  </div>
                </div>
              ) : (
                <ScrollArea
                  className={cn(
                    "h-[480px] py-4 px-2",
                    theme === "dark" ? "scrollbar-thumb-gray-700" : "scrollbar-thumb-gray-300",
                  )}
                >
                  <div className="px-2 space-y-6">
                    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex justify-center mb-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-2 py-1 text-xs font-medium",
                              theme === "dark" ? "bg-gray-800" : "bg-gray-100",
                            )}
                          >
                            {date}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          {dateMessages.map((message, index) => (
                            <div
                              key={`${date}-${index}`}
                              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                            >
                              {message.role === "assistant" && (
                                <Avatar className="h-8 w-8 mr-2 mt-1 ring-1 ring-primary/30 flex-shrink-0">
                                  <AvatarImage src="/logo.png" alt="MediTrack" />
                                  <AvatarFallback className="bg-primary/20 text-primary">MT</AvatarFallback>
                                </Avatar>
                              )}

                              <div
                                className={cn(
                                  "max-w-[85%] rounded-2xl p-3 shadow-sm",
                                  message.role === "user"
                                    ? "bg-gradient-to-br from-primary to-blue-600 text-white"
                                    : theme === "dark"
                                      ? "bg-gray-800 text-white"
                                      : "bg-gray-100 text-gray-900",
                                )}
                              >
                                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                                <div className="text-xs mt-1 opacity-70 flex justify-between items-center">
                                  <span>{formatTime(message.timestamp)}</span>

                                  {message.role === "assistant" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => speakMessage(message.content)}
                                      className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                                    >
                                      <Volume2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {message.role === "user" && (
                                <Avatar className="h-8 w-8 ml-2 mt-1 ring-1 ring-primary/30 flex-shrink-0">
                                  <AvatarImage src="/avatar.png" alt="User" />
                                  <AvatarFallback className="bg-blue-500/20 text-blue-600">U</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex items-start gap-3 group">
                        <Avatar className="h-8 w-8 border bg-primary/10">
                          <AvatarFallback className="text-xs font-semibold bg-primary text-white">
                            AI
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-800",
                          )}
                        >
                          <div className="flex space-x-1 items-center h-5">
                            <div className={`${typingAnimationStyles.base} ${typingAnimationStyles.first}`} />
                            <div className={`${typingAnimationStyles.base} ${typingAnimationStyles.second}`} />
                            <div className={`${typingAnimationStyles.base} ${typingAnimationStyles.third}`} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </CardContent>

            <CardFooter className={cn("p-3 pt-2 border-t", theme === "dark" ? "border-gray-700" : "border-gray-200")}>
              <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className={cn(
                    "flex-grow rounded-full",
                    theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200",
                    "focus-visible:ring-primary/50",
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isLoading || !input.trim()}
                      className={cn(
                        "rounded-full bg-primary hover:bg-primary/90",
                        "transition-all duration-200",
                        !input.trim() && !isLoading && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send message</p>
                  </TooltipContent>
                </Tooltip>
              </form>
            </CardFooter>

            <div className="absolute bottom-16 right-3 flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearConversation}
                    disabled={isLoading || messages.length <= 1}
                    className={cn(
                      "text-xs flex items-center gap-1",
                      theme === "dark" ? "border-gray-700 bg-gray-800 hover:bg-gray-700" : "",
                    )}
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear conversation history</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessages([
                        {
                          role: "assistant",
                          content:
                            "Hello! I am MediTrack Assistant. How can I help you with your medical tracking needs today?",
                          timestamp: new Date(),
                        },
                      ])
                    }}
                    disabled={isLoading}
                    className={cn(
                      "text-xs flex items-center gap-1",
                      theme === "dark" ? "border-gray-700 bg-gray-800 hover:bg-gray-700" : "",
                    )}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh conversation</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </Card>
    </TooltipProvider>
  )
}

export default ChatbotInterface
