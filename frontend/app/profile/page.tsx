"use client"
import { useState } from "react";

export default function PatientInfoForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    trimester: "",
    allergies: "",
    medications: "",
    emergencyContact: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    // Example: Submit to your FastAPI endpoint
    try {
      const res = await fetch("http://localhost:8000/submit_patient_info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      console.log("Server response:", result);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting form:", err);
    }

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        fullName: "",
        trimester: "",
        allergies: "",
        medications: "",
        emergencyContact: "",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen w-full">
      <div className="w-full h-full overflow-y-auto bg-white rounded-2xl shadow-xl p-8 no-scrollbar">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Patient Information Form
          </h1>
          <p className="text-gray-600">
            Fill out patient information below. All fields are optional.
          </p>
        </div>

        {submitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              Form submitted successfully!
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
              Personal Information
            </h2>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none  transition"
            />
          </div>

          {/* Pregnancy Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
              Pregnancy Information
            </h2>
            <select
              name="trimester"
              value={formData.trimester}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none transition bg-white"
            >
              <option value="">Select Trimester</option>
              <option value="first">First Trimester (1-12 weeks)</option>
              <option value="second">Second Trimester (13-26 weeks)</option>
              <option value="third">Third Trimester (27-40 weeks)</option>
            </select>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
              Medical Information
            </h2>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              rows={3}
              placeholder="Known allergies"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none transition"
            />
            <textarea
              name="medications"
              value={formData.medications}
              onChange={handleChange}
              rows={3}
              placeholder="Current medications"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none  transition"
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
              Emergency Contact
            </h2>
            <input
              type="text"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="Emergency contact name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none  transition"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full bg-purple-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition"
          >
            Submit Patient Information
          </button>
        </div>
      </div>
    </div>
  );
}
