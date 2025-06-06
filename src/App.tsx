import { useDeferredValue, useState } from "react";
import VideoPlayer from "./plyr/Video";

const source = "https://movie.tg-iptv.site/movies/822119/master.m3u8";
function App() {
  const [src, setSrc] = useState(source);
  const deferred = useDeferredValue(src, src);

  return (
    <main className="flex flex-col items-center gap-8 py-16 max-w-[1280px] mx-auto">
      <h1 className="text-4xl font-bold">HLS multi audio!</h1>
      <div className="flex flex-row items-center gap-6"></div>
      <VideoPlayer src={src} />
      <input
        className="min-w-[200px] max-w-[400px] w-full border outline-transparent outline-4  border-blue-400 rounded-md px-3 py-2 focus:border-blue-600 focus:outline-blue-400"
        placeholder="Enter HLS Url with multi audio"
        defaultValue={deferred}
        onChange={(e) => {
          const val = e.currentTarget.value.trim();
          if (val.match(/http(s|)\:\/\/[^.]+[.][^.]+.+[.]m3u8/)) {
            setSrc(val);
          }
        }}
      ></input>
    </main>
  );
}

export default App;
