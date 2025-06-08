import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
// import Plyr, { APITypes, PlyrProps, PlyrInstance } from "plyr-react";
import { AudioSettings, ExtendedPlyr } from "./multi-audio/menu";

export default function VideoPlayer({ src = "" }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const videosRef = useRef<Hls["levels"]>([]);
  const audiosRef = useRef<Hls["audioTracks"]>([]);
  const subsRef = useRef<Hls["subtitleTracks"]>([]);
  const id = useMemo(() => Date.now(), []);
  const [options, setOptions] = useState({});

  const updateQuality = useCallback(
    (newQuality: number = 0) => {
      try {
        console.log(hlsRef.current, newQuality);
        if (hlsRef.current) {
          const hls = hlsRef.current;
          if (newQuality === 0) {
            hls.currentLevel = -1;
          } else {
            const ind = hls.levels.findIndex(
              (level) => level.height === newQuality
            );
            hls.currentLevel = ind;
          }
        }
      } catch (err) {}
    },
    [hlsRef.current]
  );

  useEffect(() => {
    const video2 = document.querySelector(
      `#player-video2-${id}`
    ) as HTMLVideoElement | null;
    if (videoRef.current && video2) {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      // playerRef.current?.destroy();
      // playerRef.current = null;

      const video = videoRef.current;
      const defaultOptions: Partial<Plyr.Options> = {
        // debug: true,
      };

      if (!Hls.isSupported()) {
        console.log("Hls not supported !");
        video.src = src;
        playerRef.current = new Plyr(video, defaultOptions);
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
          const player = (playerRef.current ||
            new Plyr(video, defaultOptions)) as ExtendedPlyr;
          playerRef.current = player || null;
          console.log("PLYR :", player);
          console.log("PLYR Config :", player?.config);
          console.log("PLYR Source :", player?.source);
          if (player?.config?.quality) {
            player.config.quality = {
              ...player.config.quality,
              ...defaultOptions.quality,
            };
          }
          if (player?.config?.captions) {
            player.config.captions = {
              ...player.config.captions,
              active: false,
            };
          }
          player?.on("canplay", () => {
            console.log(":: PLYR Can Play ::");
            // @ts-ignore
            new AudioSettings(playerRef.current, hlsRef.current);
          });

          // video2.play();
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

          // hls.on(Hls.Events.load, ()=>{

          // })
        });

        hls.on(Hls.Events.ERROR, (e, data) => {
          console.error("HLS Error :", data);
        });
        setOptions(defaultOptions);
        // @ts-ignore
        hls.attachMedia(video);
        console.log("HLS source :", hls);

        // video2 && hls.attachMedia(video2);
      }
      return () => {
        // playerRef.current?.destroy();
        hlsRef.current?.destroy();
        // playerRef.current = null;
        // hlsRef.current = null;
      };
    }
  }, [videoRef.current, src]);

  // @ts-ignore
  return (
    <>
      <video
        className="w-full aspect-video"
        id={`player-video-${id}`}
        ref={videoRef}
      ></video>
      <video
        id={`player-video2-${id}`}
        className="mt-5 w-full aspect-video"
        controls
        muted
        hidden
      ></video>
    </>
  );
}
