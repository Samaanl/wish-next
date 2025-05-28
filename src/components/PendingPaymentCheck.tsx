"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

export default function PendingPaymentCheck() {
  // Component is now disabled - automatic payment checking has been removed
  // Users are instructed to click "Continue" during checkout instead
  return null;
}
