"use client";

import Image from "next/image";
import Card from "../components/card";

export default function Yoga() {
  const trimesterExercises = {
    1: [
      { id: 1, img: "/sddefault.jpg", title: "Neck Stretch" },
      { id: 2, img: "/shutterstock_190732922-1024x681.jpg", title: "Cat-Cow Pose" },
      { id: 3, img: "/maxresdefault.jpg", title: "Pelvic Tilt" },
    ],
    2: [
      { id: 1, img: "/pregnancyexercises.jpeg", title: "Seated Twist" },
        { id: 2, img: "/download (5).jpeg", title: "Hip Opener" },
      { id: 3, img: "/photo-trm-pregnant-women-working-out.jpg", title: "Wall Squat" },
    ],
    3: [
      { id: 1, img: "/t3_1.png", title: "Supported Squat" },
      { id: 2, img: "/t3_2.png", title: "Side-Lying Stretch" },
      { id: 3, img: "/t3_3.png", title: "Breathing Exercise" },
    ],
  };

  const trimesters = [
    { id: 1, name: "1st Trimester" },
    { id: 2, name: "2nd Trimester" },
    { id: 3, name: "3rd Trimester" },
  ];

  // Function to start pose detection
  const startPoseDetection = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/start-pose"); // your FastAPI endpoint
      const text = await res.text();
      alert("Pose Detection Started! Check your webcam window.");
      // Optional: open a new tab with endpoint
      window.open("http://127.0.0.1:8000/start-pose", "_blank");
    } catch (err) {
      console.error(err);
      alert("Failed to start pose detection.");
    }
  };

  return (
    <div className="no-scrollbar h-full w-full bg-white rounded-3xl px-4 pt-5 pb-3 overflow-y-auto scrollbar-hide">
      <div className="pb-2 -mb-3 text-center text-3xl bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent font-[350]">
        Trimester-Based Exercises, Assisted in Real Time Through Your Device Camera
      </div>

      {trimesters.map(({ id, name }) => (
        <div
          key={id}
          className="no-scrollbar flex flex-col h-60 w-full bg-[#F9F9Fc] px-4 rounded-lg justify-center relative mt-7 cursor-pointer hover:bg-gray-100 transition"
          onClick={startPoseDetection} // <-- click triggers pose detection
        >
          <div className="absolute top-1.5 text-center bg-linear-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent rounded-br-md rounded-bl-md w-33 text-lg font-normal">
            {name}
          </div>

          <div className="no-scrollbar flex gap-5 mt-5 overflow-x-auto scrollbar-hide p-2">
            {trimesterExercises[id].map((exercise) => (
              <Card
                key={exercise.id}
                img={
                  <div className="relative h-50 w-90">
                    <Image
                      src={exercise.img}
                      alt={exercise.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                }
                className="text-gray-700"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
