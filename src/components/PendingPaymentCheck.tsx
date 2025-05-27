"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

export default function PendingPaymentCheck() {
  const { currentUser, refreshUserCredits } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setProcessingMessage(message);
    setTimeout(() => setProcessingMessage(""), 5000);
  };  // Check for completed payments when user returns
  const checkForCompletedPayments = async () => {
    if (!currentUser?.id || isChecking) return;

    try {
      setIsChecking(true);
      console.log("🔍 Checking for completed payments...");
      console.log("👤 Current user:", { id: currentUser.id, email: currentUser.email });

      // Check localStorage for debugging
      const checkoutInfo = localStorage.getItem("checkoutUserInfo");
      console.log("💾 Checkout info in localStorage:", checkoutInfo);

      // Check if user has any recent unprocessed orders in Lemon Squeezy
      const response = await axios.post("/api/check-payment-status", {
        userId: currentUser.id,
        email: currentUser.email,
      });

      console.log("📡 API Response:", response.data);

      if (response.data.paymentFound && response.data.creditsAdded) {
        console.log("✅ Found and processed completed payment");
        showNotification(
          `Payment found! ${response.data.credits} credits added to your account.`,
          "success"
        );
        
        // Refresh user credits
        await refreshUserCredits();
        
        // Clear any stored checkout info
        localStorage.removeItem("checkoutUserInfo");
      } else if (response.data.paymentFound && response.data.alreadyProcessed) {
        console.log("ℹ️ Payment already processed");
        localStorage.removeItem("checkoutUserInfo");
      } else {
        console.log("❌ No payment found or not processed");
      }
    } catch (error) {
      console.error("❌ Error checking payment status:", error);
      showNotification("Error checking payment status", "error");
    } finally {
      setIsChecking(false);
    }
  };

  // Check if user has pending checkout and should be monitored
  const shouldMonitorPayments = () => {
    const checkoutInfo = localStorage.getItem("checkoutUserInfo");
    if (!checkoutInfo) return false;

    try {
      const info = JSON.parse(checkoutInfo);
      const checkoutTime = new Date(info.timestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - checkoutTime.getTime()) / 60000;

      // Monitor for 30 minutes after checkout
      return diffMinutes < 30 && info.id === currentUser?.id;
    } catch {
      localStorage.removeItem("checkoutUserInfo");
      return false;
    }
  };
  // Check for payments when component mounts and user is available
  useEffect(() => {
    if (currentUser?.id) {
      // Initial check after small delay
      const initialTimer = setTimeout(() => {
        checkForCompletedPayments();
      }, 1000);

      // If user has pending checkout, check every 30 seconds
      let intervalTimer: NodeJS.Timeout | null = null;

      if (shouldMonitorPayments()) {
        console.log(
          "🔄 Starting payment monitoring - checking every 30 seconds"
        );
        showNotification("Monitoring for payment completion...", "info");

        intervalTimer = setInterval(() => {
          if (shouldMonitorPayments()) {
            checkForCompletedPayments();
          } else {
            // Stop monitoring if no longer needed
            if (intervalTimer) {
              clearInterval(intervalTimer);
              console.log("⏹️ Stopped payment monitoring");
            }
          }
        }, 30000); // Check every 30 seconds
      }

      return () => {
        clearTimeout(initialTimer);
        if (intervalTimer) {
          clearInterval(intervalTimer);
        }
      };
    }
  }, [currentUser?.id]);

  // Only render if there's a processing message
  if (!processingMessage) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center space-x-2">
          {isChecking && (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          )}
          <span className="text-sm">{processingMessage}</span>
        </div>
      </div>
    </div>
  );
}
