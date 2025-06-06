import { useState } from "react";
import VideoPlayer from "./plyr/Video";

const source = "https://movie.tg-iptv.site/movies/822119/master.m3u8";
function App() {
  return (
    <main className="flex flex-col items-center gap-8 py-16 max-w-[1280px] mx-auto">
      <h1 className="text-4xl font-bold">HLS multi audio!</h1>
      <div className="flex flex-row items-center gap-6"></div>
      <VideoPlayer src={source} />
    </main>
  );
}

export default App;
