import { useRef, useEffect, useCallback, useState } from "react";
import Hls from "hls.js";
// import Plyr from "plyr";
import "plyr/dist/plyr.css";
import Plyr, { APITypes, PlyrProps, PlyrInstance } from "plyr-react";
import { AudioSettings } from "./multi-audio/menu";

export default function VideoPlayer({ src = "" }) {
  const videoRef = useRef<APITypes | null>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const videosRef = useRef<Hls["levels"]>([]);
  const audiosRef = useRef<Hls["audioTracks"]>([]);
  const subsRef = useRef<Hls["subtitleTracks"]>([]);
  const id = Date.now();
  const [options, setOptions] = useState({});

  const updateQuality = useCallback(
    (newQuality: number = 0) => {
      if (hlsRef.current) {
        const hls = hlsRef.current;
        if (newQuality === 0) {
          hls.currentLevel = -1; // Enable AUTO quality if option.value = 0
        } else {
          hls.levels.forEach((level, levelIndex) => {
            if (level.height === newQuality) {
              console.log("Found quality match with " + newQuality);
              hls.currentLevel = levelIndex;
            }
          });
        }
      }
    },
    [hlsRef.current]
  );

  useEffect(() => {
    if (videoRef.current) {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      // playerRef.current?.destroy();
      // playerRef.current = null;

      const video = videoRef.current;
      const defaultOptions: Partial<Plyr.Options> = {
        debug: true,
        // @ts-ignore
        // id: Date.now(),
      };

      if (!Hls.isSupported()) {
        console.log("Hls not supported !");
        // video = src;
        // playerRef.current = new Plyr(video, defaultOptions);
      } else {
        console.log("Hls is supported !");
        hlsRef.current = new Hls();
        const hls = hlsRef.current;
        hls.loadSource(src);

        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
          console.log("HLS Manifest Parsed :", data);

          // subs audio and videos
          audiosRef.current = hls.audioTracks;
          subsRef.current = hls.subtitleTracks;
          videosRef.current = hls.levels;

          // Quality levels
          const availableQualities = [...hls.levels]
            .sort((a, b) => a.height - b.height)
            .reverse();
          // .filter((l) => !!l.id);
          console.log("Levels :", availableQualities);

          // Add new qualities to option
          defaultOptions.quality = {
            default: 0,
            options: [0, ...availableQualities.map((lv) => lv.height)],
            forced: true,
            onChange: (v) => updateQuality(v),
          };
          // Labels
          defaultOptions.i18n = {
            qualityLabel: {
              0: "Auto",
              ...Object.fromEntries(
                availableQualities.map((lv, i) => [
                  lv.height,
                  lv.height.toString() || `Quality-${i + 1}`,
                ])
              ),
            },
          };
          setOptions(defaultOptions);

          // Initialize new Plyr player with quality options
          const player = videoRef.current?.plyr;
          console.log("PLYR :", player);
          console.log("PLYR Config :", player?.config);
          console.log("PLYR Source :", player?.source);
          playerRef.current = player || null;
          player?.on("ready", () => {
            console.log(":: PLYR Ready ::");
            new AudioSettings(player, hls);
          });
          // new AudioSettings(player, hls);

          hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
            const span = document.querySelector(
              ".plyr__menu__container [data-plyr='quality'][value='0'] span"
            );
            if (span) {
              if (hls.autoLevelEnabled) {
                span.innerHTML = `AUTO (${hls.levels[data.level].height}p)`;
              } else {
                span.innerHTML = `AUTO`;
              }
            }
          });

          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
            // @ts-ignore
          });
        });

        hls.on(Hls.Events.ERROR, (e, data) => {
          console.error("HLS Error :", data);
        });
        setOptions(defaultOptions);
        // @ts-ignore
        hls.attachMedia(video.plyr.media);
        console.log("HLS source :", hls);
      }
      return () => {
        playerRef.current?.destroy();
        hlsRef.current?.destroy();
        // playerRef.current = null;
        // hlsRef.current = null;
      };
    }
  }, [videoRef.current, src]);

  // @ts-ignore
  return <Plyr id={`player-${id}`} ref={videoRef} options={options}></Plyr>;
}
