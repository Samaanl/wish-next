import React, { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { WishInputs } from "@/utils/wishService";
import { motion } from "framer-motion";

type FormProps = {
  onSubmit: (inputs: WishInputs) => void;
  isLoading: boolean;
};

export default function WishForm({ onSubmit, isLoading }: FormProps) {
  const [inputs, setInputs] = useState<WishInputs>({
    occasion: "",
    tone: "",
    recipientName: "",
    relationship: "",
    memorableEvent: "",
    hobby: "",
    age: "",
    messageLength: "",
    messageFormat: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const occasions = [
    "Birthday",
    "Anniversary",
    "New Job",
    "Farewell",
    "Condolence",
    "Breakup",
    "Apology",
    "Graduation",
    "Wedding",
    "Promotion",
    "Baby Shower",
    "Recovery",
  ];
  const tones = [
    "Funny",
    "Emotional",
    "Formal",
    "Sarcastic",
    "Romantic",
    "Spiritual",
    "Inspirational",
    "Playful",
    "Heartfelt",
    "Professional",
    "Casual",
    "Poetic",
  ];

  const messageLengths = [
    "Short (1-2 sentences)",
    "Medium (3-4 sentences)",
    "Long (5-6 sentences)",
  ];

  const messageFormats = [
    "Text Message",
    "WhatsApp Message",
    "Email",
    "Social Media Post",
    "Card/Letter",
    "Speech/Verbal",
    "Instagram Caption",
    "Facebook Post",
    "LinkedIn Message",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(
      "Form submit triggered, currentStep:",
      currentStep,
      "totalSteps:",
      totalSteps
    );

    // If not on the last step, don't submit the form
    if (currentStep < totalSteps) {
      console.log("Moving to next step instead of submitting");
      nextStep();
      return;
    }

    // Otherwise proceed with form submission
    console.log("Proceeding with form submission");
    onSubmit(inputs);
  };

  const nextStep = () => {
    console.log(
      "nextStep called, current step:",
      currentStep,
      "total steps:",
      totalSteps
    );
    if (currentStep < totalSteps) {
      console.log("Moving to step:", currentStep + 1);
      setCurrentStep((prev) => {
        console.log("Setting currentStep from", prev, "to", prev + 1);
        return prev + 1;
      });
      console.log(
        "After setCurrentStep call, currentStep is still:",
        currentStep
      );
    } else {
      console.log("Already at final step, cannot proceed further");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const canProceedStep1 = inputs.occasion && inputs.tone;
  const canProceedStep2 = inputs.recipientName && inputs.relationship;
  const canProceedStep3 = true; // Step 3 has only optional fields
  const canProceedStep4 = inputs.messageLength && inputs.messageFormat;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  The Basics
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select the occasion and tone for your wish.
                </p>
              </div>

              <div className="group">
                <label
                  htmlFor="occasion"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Select Occasion
                </label>
                <div className="relative">
                  <select
                    id="occasion"
                    name="occasion"
                    value={inputs.occasion}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 appearance-none border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                              transition duration-150 ease-in-out"
                  >
                    <option value="">-- Select an occasion --</option>
                    {occasions.map((occasion) => (
                      <option key={occasion} value={occasion}>
                        {occasion}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="tone"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Choose Tone
                </label>
                <div className="relative">
                  <select
                    id="tone"
                    name="tone"
                    value={inputs.tone}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 appearance-none border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                              transition duration-150 ease-in-out"
                  >
                    <option value="">-- Select a tone --</option>
                    {tones.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Recipient Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tell us about who will receive the wish.
                </p>
              </div>

              <div className="group">
                <label
                  htmlFor="recipientName"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Recipient Name
                </label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={inputs.recipientName}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  required
                  placeholder="Enter recipient's name"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           transition duration-150 ease-in-out"
                />
              </div>

              <div className="group">
                <label
                  htmlFor="relationship"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Relationship
                </label>
                <input
                  type="text"
                  id="relationship"
                  name="relationship"
                  value={inputs.relationship}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  required
                  placeholder="e.g. friend, wife, boss, etc."
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           transition duration-150 ease-in-out"
                />
              </div>

              <div className="group">
                <label
                  htmlFor="age"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Age or Years (Optional)
                </label>
                <input
                  type="text"
                  id="age"
                  name="age"
                  value={inputs.age}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="For birthdays/anniversaries"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           transition duration-150 ease-in-out"
                />
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Personal Touch
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add details that make your wish unique and meaningful.
                </p>
              </div>
              <div className="group">
                <label
                  htmlFor="memorableEvent"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Memorable Event or Inside Joke (Optional)
                </label>
                <textarea
                  id="memorableEvent"
                  name="memorableEvent"
                  value={inputs.memorableEvent}
                  onChange={handleChange}
                  placeholder="Share a memory or inside joke"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           transition duration-150 ease-in-out"
                  rows={3}
                />
              </div>
              <div className="group">
                <label
                  htmlFor="hobby"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Hobby/Interest (Optional)
                </label>
                <input
                  type="text"
                  id="hobby"
                  name="hobby"
                  value={inputs.hobby}
                  onChange={handleChange}
                  placeholder="Enter a hobby or interest"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           transition duration-150 ease-in-out"
                />
              </div>{" "}
              <div className="pt-6">
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-2">
                  Almost there! Let's customize your message format.
                </p>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Message Preferences
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose the length and format that best suits your needs.
                </p>
              </div>

              <div className="group">
                <label
                  htmlFor="messageLength"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Message Length
                </label>
                <div className="relative">
                  <select
                    id="messageLength"
                    name="messageLength"
                    value={inputs.messageLength}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 appearance-none border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                              transition duration-150 ease-in-out"
                  >
                    <option value="">-- Select message length --</option>
                    {messageLengths.map((length) => (
                      <option key={length} value={length}>
                        {length}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="messageFormat"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
                >
                  Message Format
                </label>
                <div className="relative">
                  <select
                    id="messageFormat"
                    name="messageFormat"
                    value={inputs.messageFormat}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 appearance-none border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                              transition duration-150 ease-in-out"
                  >
                    <option value="">-- Select message format --</option>
                    {messageFormats.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-2">
                  Perfect! Ready to generate your personalized wish?
                </p>
              </div>
            </div>
          </motion.div>
        );
    }
  }; // Add this function to handle key press events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentStep < totalSteps) {
      e.preventDefault(); // Prevent form submission
      if (
        (currentStep === 1 && canProceedStep1) ||
        (currentStep === 2 && canProceedStep2) ||
        (currentStep === 3 && canProceedStep3)
      ) {
        nextStep();
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto"
      noValidate
    >
      <div className="mb-8">
        {" "}
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex flex-col items-center ${
                currentStep >= step
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-medium mb-1
                ${
                  currentStep > step
                    ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                    : currentStep === step
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {currentStep > step ? (
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>{" "}
              <span className="text-xs">
                {step === 1
                  ? "Basic"
                  : step === 2
                  ? "Details"
                  : step === 3
                  ? "Personal"
                  : "Format"}
              </span>
            </div>
          ))}
          <div className="hidden lg:block absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
        </div>
      </div>

      {renderStepContent()}

      <div className="mt-8 flex justify-between">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Previous
          </button>
        )}
        <div className={currentStep > 1 ? "ml-auto" : "mx-auto"}>
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                console.log(
                  "Continue button clicked, moving from step",
                  currentStep,
                  "to",
                  currentStep + 1
                );
                nextStep();
              }}
              disabled={
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canProceedStep2) ||
                (currentStep === 3 && !canProceedStep3)
              }
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-md 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
                       disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-md 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
                       disabled:opacity-70 transition duration-150 ease-in-out flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>Creating Magic...</span>
                </>
              ) : (
                <>
                  <span>Generate Wish</span>
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
