import React, { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { WishInputs } from "@/utils/wishService";

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
  });

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
    onSubmit(inputs);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto">
      <div>
        <label htmlFor="occasion" className="block text-sm font-medium mb-1">
          Select Occasion
        </label>
        <select
          id="occasion"
          name="occasion"
          value={inputs.occasion}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">-- Select an occasion --</option>
          {occasions.map((occasion) => (
            <option key={occasion} value={occasion}>
              {occasion}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tone" className="block text-sm font-medium mb-1">
          Choose Tone
        </label>
        <select
          id="tone"
          name="tone"
          value={inputs.tone}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">-- Select a tone --</option>
          {tones.map((tone) => (
            <option key={tone} value={tone}>
              {tone}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="recipientName"
          className="block text-sm font-medium mb-1"
        >
          Recipient Name
        </label>
        <input
          type="text"
          id="recipientName"
          name="recipientName"
          value={inputs.recipientName}
          onChange={handleChange}
          required
          placeholder="Enter recipient's name"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="relationship"
          className="block text-sm font-medium mb-1"
        >
          Relationship
        </label>
        <input
          type="text"
          id="relationship"
          name="relationship"
          value={inputs.relationship}
          onChange={handleChange}
          required
          placeholder="e.g. friend, wife, boss, etc."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="memorableEvent"
          className="block text-sm font-medium mb-1"
        >
          Memorable Event or Inside Joke (Optional)
        </label>
        <textarea
          id="memorableEvent"
          name="memorableEvent"
          value={inputs.memorableEvent}
          onChange={handleChange}
          placeholder="Share a memory or inside joke"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={2}
        />
      </div>

      <div>
        <label htmlFor="hobby" className="block text-sm font-medium mb-1">
          Hobby/Interest (Optional)
        </label>
        <input
          type="text"
          id="hobby"
          name="hobby"
          value={inputs.hobby}
          onChange={handleChange}
          placeholder="Enter a hobby or interest"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="age" className="block text-sm font-medium mb-1">
          Age or Years (Optional)
        </label>
        <input
          type="text"
          id="age"
          name="age"
          value={inputs.age}
          onChange={handleChange}
          placeholder="For birthdays/anniversaries"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Generating Wish...
          </>
        ) : (
          "Generate Wish"
        )}
      </button>
    </form>
  );
}
