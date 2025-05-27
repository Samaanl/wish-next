"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

export default function PaymentDebugPage() {
  const { currentUser } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPaymentLookup = async () => {
    if (!currentUser?.email) {
      alert("Please log in first");
      return;
    }

    setLoading(true);
    try {
      // Test the Lemon Squeezy API directly
      const response = await axios.get(
        `/api/test-payment-lookup?email=${encodeURIComponent(
          currentUser.email
        )}`
      );
      setResult(response.data);
    } catch (error: any) {
      setResult({ error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentStatus = async () => {
    if (!currentUser?.id || !currentUser?.email) {
      alert("Please log in first");
      return;
    }

    setLoading(true);
    try {
      // Test our payment status API
      const response = await axios.post("/api/check-payment-status", {
        userId: currentUser.id,
        email: currentUser.email,
      });
      setResult(response.data);
    } catch (error: any) {
      setResult({ error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payment Debug Console</h1>
        {currentUser ? (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <p>
              <strong>ID:</strong> {currentUser.id}
            </p>
            <p>
              <strong>Email:</strong> {currentUser.email}
            </p>
            <p>
              <strong>Credits:</strong> {currentUser.credits}
            </p>
          </div>
        ) : (
          <div className="bg-yellow-100 p-4 rounded-lg mb-6">
            <p>Please log in to test payment lookup</p>
          </div>
        )}{" "}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Debug</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(
              {
                checkoutUserInfo:
                  typeof window !== "undefined"
                    ? localStorage.getItem("checkoutUserInfo")
                    : "N/A (SSR)",
                lastPaymentCheck:
                  typeof window !== "undefined"
                    ? localStorage.getItem("lastPaymentCheck")
                    : "N/A (SSR)",
              },
              null,
              2
            )}
          </pre>
        </div>
        <div className="flex gap-4 mb-6">
          <button
            onClick={testPaymentLookup}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Lemon Squeezy API"}
          </button>

          <button
            onClick={testPaymentStatus}
            disabled={loading}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Payment Status API"}
          </button>
        </div>
        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
