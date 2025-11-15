"use client";
import Image from "next/image";
import { useState } from "react";
import voiceAnimation from "@/assests/voiceAnimation.json";
import Lottie from "lottie-react";

type message = {
  text: string;
  sender: "user" | "bot";
};

export default function Chat() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [dimScreen,setDimScreen]=useState(false);


  const send = async () => {
    if (input.trim() === "" || isLoading) return;

    const userMessage = input;


    setChat((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });

      const data = await response.json();
      const botText = data.answer || "Sorry, no response.";

      if (data.audio) {
    playAudio(data.audio);
  }

      // Add bot reply
      setChat((prev) => [...prev, { text: botText, sender: "bot" }]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        { text: "Something went wrong!", sender: "bot" },
      ]);
    }

    setIsLoading(false);
  };

  const playAudio = (base64Audio: string) => {
  const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
  audio.play();
};

const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
const [isRecording, setIsRecording] = useState(false);

const handleVoiceClick = async () => {
  if (!isRecording) {
    // 🔹 Start recording
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", blob, "voice.wav");

      try {
        // Send to STT endpoint
        const res = await fetch("http://127.0.0.1:8000/stt", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        const transcription = data.text || "";

        // Append STT result to chat
        setChat((prev) => [...prev, { text: transcription, sender: "user" }]);

        // Send transcription to chat API
        const chatRes = await fetch("http://127.0.0.1:8000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: transcription }),
        });
        const botData = await chatRes.json();
        if (botData.audio) playAudio(botData.audio);
        setChat((prev) => [...prev, { text: botData.answer, sender: "bot" }]);
      } catch (err) {
        console.error("STT or chat error:", err);
      } finally {
        setShowAnimation(false);
        setDimScreen(false);
      }
    };

    mediaRecorder.start();
    setRecorder(mediaRecorder);
    setIsRecording(true);
    setShowAnimation(true);
    setDimScreen(true);

  } else {
    // 🔹 Stop recording
    recorder?.stop();
    setRecorder(null);
    setIsRecording(false);
  }
};




  return (
    <>
      <div className={`flex h-full w-full flex-col justify-center items-center mx-5 gap-y-5 py-4 `}>
  
         {showAnimation && (<div className="h-60 w-60 scale-animate absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  opac
          ity-100 z-20">
          <Lottie animationData={voiceAnimation} loop={true} />
          </div>)    
          }
        <div
          id="chatBox"
          className={`${dimScreen? "opacity-30":"opacity-100"} flex flex-col px-2 overflow-y-auto h-full w-full rounded-xl scrollbar-hide`}
        >
         
          {chat.map((message, index) => (
            <div
              key={index}
              className={`bg-gray-100 w-fit max-w-[60%] h-fit p-1 px-2 rounded-md mb-4  ${message.sender === "user"
                  ? "rounded-br-none self-end"
                  : "rounded-bl-none self-start"
                }`}
            >
              {message.text}
            </div>
          ))}
        </div>

        <div className={`w-[53%] h-24 bg-[#f2f2f7] px-4 py-2 rounded-xl flex flex-col ${dimScreen? "opacity-30":"opacity-100"}`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                e.preventDefault();
                send();
              }
            }}
            disabled={isLoading}
            className="outline-none resize-none w-[95%] h-14 mt-1 placeholder-text-gray-500 text-black scrollbar-hide disabled:opacity-50"
            placeholder={isLoading ? "AI is thinking..." : "Enter your text here..."}
          ></textarea>

          <div className="flex gap-x-5  ml-auto -mr-1 mb-0.5">
         
            <div
              onClick={isLoading ? undefined : () =>   {setShowAnimation(!showAnimation), setDimScreen(!dimScreen) , handleVoiceClick()}}
              className={`  ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <Image src="/voice1.png" alt="button" height={32} width={32} className="hover:scale-105 cursor-pointer" />
            </div>
               <div
              onClick={isLoading ? undefined : send}
              className={`  ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            ><Image src="/send button.png" alt="button" height={32} width={32} className="hover:scale-105 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
