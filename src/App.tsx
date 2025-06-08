import { useRef, useState } from "react";
import VideoPlayer from "./plyr/Video";

const source = "https://movie.tg-iptv.site/movies/822119/master.m3u8";
function App() {
  const [src, setSrc] = useState(source);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <main className="flex flex-col items-center gap-8 py-16 max-w-[1280px] mx-auto">
      <h1 className="text-4xl font-bold">HLS multi audio!</h1>
      <div className="flex flex-row items-center gap-6"></div>
      <VideoPlayer src={src} />
      <div className="pt-5 w-full flex  justify-center gap-3">
        <input
          className="min-w-[200px] max-w-[400px] shrink-0 w-full border outline-transparent outline-4  border-blue-400 rounded-md px-3 py-2 focus:border-blue-600 focus:outline-blue-400"
          placeholder="Enter HLS Url with multi audio"
          defaultValue={src}
          ref={inputRef}
        />
        <button
          type="button"
          className="px-3 py-2 shrink-0 rounded-md border-none outline-none bg-blue-700 text-white "
          onClick={() => {
            const val = inputRef.current?.value.trim();
            if (val?.match(/http(s|)\:\/\/[^.]+[.][^.]+.+[.]m3u8/)) {
              setSrc(val);
            }
          }}
        >
          Load Source
        </button>
      </div>
    </main>
  );
}

export default App;
