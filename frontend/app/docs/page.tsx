"use client";
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [ultrasoundFile, setUltrasoundFile] = useState(null);

  const [prescriptionSummary, setPrescriptionSummary] = useState("");
  const [ultrasoundSummary, setUltrasoundSummary] = useState("");

  const handlePrescriptionUpload = (e) => {
    setPrescriptionFile(e.target.files[0]);
  };

  const handleUltrasoundUpload = (e) => {
    setUltrasoundFile(e.target.files[0]);
  };

  const handlePrescriptionSummarize = async () => {
    if (!prescriptionFile) return alert("Please upload a prescription image");

    const formData = new FormData();
    formData.append("file", prescriptionFile);

    try {
      const response = await axios.post(
        "http://localhost:8000/prescription", // change to your FastAPI endpoint
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setPrescriptionSummary(response.data.summary);
    } catch (err) {
      console.error(err);
      alert("Error summarizing prescription");
    }
  };

  const handleUltrasoundSummarize = async () => {
    if (!ultrasoundFile) return alert("Please upload an ultrasound image");

    const formData = new FormData();
    formData.append("image", ultrasoundFile); // for multiple images, append multiple times

    try {
      const response = await axios.post(
        "http://localhost:8000/ultrasound", // FastAPI endpoint
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUltrasoundSummary(response.data.summary);
    } catch (err) {
      console.error(err);
      alert("Error summarizing ultrasound");
    }
  };

  return (
    <div className="h-full w-full bg-gray-50 flex justify-center items-center gap-10 p-6">
      {/* 🩺 Prescription Summarizer */}
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Prescription Summarizer
        </h1>

        <label className="block text-gray-700 font-semibold mb-2">
          Upload Prescription Image
        </label>
        <input
          type="file"
          className="w-full border border-gray-300 p-2 rounded-lg mb-4"
          onChange={handlePrescriptionUpload}
        />

        <button
          onClick={handlePrescriptionSummarize}
          className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Summarize
        </button>

        {prescriptionSummary && (
          <div className="mt-5 bg-gray-100 border border-gray-200 p-4 rounded-lg text-sm text-gray-700">
            <p>
              🩺 <strong>Prescription Summary:</strong>
            </p>
            <p className="mt-2">{prescriptionSummary}</p>
          </div>
        )}
      </div>

      {/* 🧬 Ultrasound Summarizer */}
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Ultrasound Summarizer
        </h1>

        <label className="block text-gray-700 font-semibold mb-2">
          Upload Ultrasound Image
        </label>
        <input
          type="file"
          className="w-full border border-gray-300 p-2 rounded-lg mb-4"
          onChange={handleUltrasoundUpload}
        />

        <button
          onClick={handleUltrasoundSummarize}
          className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Summarize
        </button>

        {ultrasoundSummary && (
          <div className="mt-5 bg-gray-100 border border-gray-200 p-4 rounded-lg text-sm text-gray-700">
            <p>
              🧬 <strong>Ultrasound Summary:</strong>
            </p>
            <p className="mt-2">{ultrasoundSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
