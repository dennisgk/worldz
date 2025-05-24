import { components, deps, utils } from "../meta";

const Home = () => {
  const query_client = deps.query.use_query_client();

  const mutation_remove_recording = deps.query.use_mutation({
    mutationFn: async (mut_props: { id: string }) =>
      await fetch(
        utils.asite.PY_BACKEND +
          `/remove_recording?id=${encodeURIComponent(mut_props.id)}`,
        { method: "POST" }
      ),
    onSuccess: () =>
      query_client.invalidateQueries({ queryKey: ["query_recordings"] }),
  });

  const mutation_add_recording_tag = deps.query.use_mutation({
    mutationFn: async (mut_props: { id: string; name: string }) =>
      await fetch(
        utils.asite.PY_BACKEND +
          `/add_recording_tag?id=${encodeURIComponent(
            mut_props.id
          )}&name=${encodeURIComponent(mut_props.name)}`,
        { method: "POST" }
      ),
    onSuccess: () =>
      query_client.invalidateQueries({ queryKey: ["query_recordings"] }),
  });

  const mutation_remove_recording_tag = deps.query.use_mutation({
    mutationFn: async (mut_props: { id: string; name: string }) =>
      await fetch(
        utils.asite.PY_BACKEND +
          `/remove_recording_tag?id=${encodeURIComponent(
            mut_props.id
          )}&name=${encodeURIComponent(mut_props.name)}`,
        { method: "POST" }
      ),
    onSuccess: () =>
      query_client.invalidateQueries({ queryKey: ["query_recordings"] }),
  });

  const query_recordings = deps.query.use_query({
    queryKey: ["query_recordings"],
    queryFn: async () => {
      let act_data = await (
        await fetch(utils.asite.PY_BACKEND + "/query_recordings")
      ).json();

      let new_arr: { [key: string]: any } = {};

      for (const obj_key in act_data) {
        let date_str = deps
          .moment(act_data[obj_key].utc_datetime)
          .utcOffset(-1 * new Date().getTimezoneOffset())
          .format("MM/DD/YYYY");

        let time_str = deps
          .moment(act_data[obj_key].utc_datetime)
          .utcOffset(-1 * new Date().getTimezoneOffset())
          .format("h:mm:ss A");

        let add_obj = {
          id: obj_key,
          transcription: act_data[obj_key].transcription,
          tags: act_data[obj_key].tags,
          time: time_str,
          utc_datetime: act_data[obj_key].utc_datetime,
        };

        if (date_str in new_arr) {
          new_arr[date_str].push(add_obj);
        } else {
          new_arr[date_str] = [add_obj];
        }
      }

      return new_arr;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    gcTime: 0,
    placeholderData: [] as any,
  });

  const [is_recording, set_is_recording] = utils.react.use_state(false);

  const media_recorder = utils.react.use_ref<MediaRecorder>(undefined);
  const audio_chunks = utils.react.use_ref<Array<Blob>>([]);

  const mutation_cancel_record = deps.query.use_mutation({
    mutationFn: async () => {
      const audioBlob = new Blob(audio_chunks.current, {
        type: "audio/webm",
      });
      audio_chunks.current = [];

      // Post to server
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      try {
        const response = await fetch(
          utils.asite.PY_BACKEND + "/add_recording",
          {
            method: "POST",
            body: formData,
          }
        );

        if (response.ok) {
          console.log("Upload successful");
        } else {
          console.error("Upload failed");
        }
      } catch (error) {
        console.error("Error uploading:", error);
      }
    },
    onSuccess: () =>
      query_client.invalidateQueries({ queryKey: ["query_recordings"] }),
  });

  const mutation_start_record = deps.query.use_mutation({
    mutationFn: async () => {
      let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      media_recorder.current = new MediaRecorder(stream);

      media_recorder.current.ondataavailable = (e) => {
        audio_chunks.current.push(e.data);
      };

      media_recorder.current.onstop = () => {
        mutation_cancel_record.mutate();
        stream.getTracks().forEach((track) => track.stop());
      };

      media_recorder.current.start();
    },
  });

  const cancel_record = () => {
    if (media_recorder.current && media_recorder.current.state !== "inactive") {
      media_recorder.current.stop();
    }
  };

  const audio = utils.react.use_ref<HTMLAudioElement>(undefined!);
  const audio_url = utils.react.use_ref<string>(undefined!);

  utils.react.use_effect(() => {
    audio.current = new Audio();
  }, []);

  const mutation_play_audio = deps.query.use_mutation({
    mutationFn: async (mut_props: { id: string }) => {
      if (audio.current) {
        audio.current.pause();
        audio.current.currentTime = 0;
        URL.revokeObjectURL(audio_url.current);
      }

      try {
        const response = await fetch(
          utils.asite.PY_BACKEND +
            `/audio?id=${encodeURIComponent(mut_props.id)}`
        ); // Or whatever your endpoint is
        const blob = await response.blob();

        audio_url.current = URL.createObjectURL(blob);
        audio.current.src = audio_url.current;
        audio.current!.play();

        let ev_list = () => {
          set_playing_audio(undefined);
          URL.revokeObjectURL(audio_url.current);
          audio.current!.removeEventListener("ended", ev_list);
        };
        audio.current.addEventListener("ended", ev_list);
      } catch (err) {
        console.error("Failed to fetch or play audio:", err);
      }
    },
  });

  const stop_play_audio = () => {
    if (audio.current) {
      audio.current.pause();
      audio.current.currentTime = 0;
      URL.revokeObjectURL(audio_url.current);
    }
  };

  const [playing_audio, set_playing_audio] = utils.react.use_state<
    string | undefined
  >(undefined);

  return (
    <components.asite.page_wrap.PageWrap text="Home">
      <components.layout.stack.Cell overflow="HIDDEN">
        <components.layout.level.Ascend>
          <components.layout.wrapper.Wrapper
            x_padding="MEDIUM"
            y_padding="MEDIUM"
            background="LEVEL"
            border_radius="MEDIUM"
          >
            <components.layout.scrollable.Scrollable direction="VERTICAL">
              <components.layout.stack.Stack direction="VERTICAL" gap="MEDIUM">
                <components.layout.stack.Cell>
                  <components.asite.text_button.TextButton
                    on_click={() => {
                      if (is_recording) {
                        cancel_record();
                        set_is_recording(false);
                      } else {
                        mutation_start_record.mutate();
                        set_is_recording(true);
                      }
                    }}
                  >
                    {is_recording ? "Stop Recording" : "Start Recording"}
                  </components.asite.text_button.TextButton>
                </components.layout.stack.Cell>
                <components.layout.stack.Cell>
                  <components.layout.simple_accordion_list.SimpleAccordionList
                    gap="MEDIUM"
                    override_always_open
                    data={
                      (Object.keys(query_recordings.data as any) as any)
                        .toSorted((a: any, b: any) =>
                          deps
                            .moment(
                              (query_recordings.data as any)[b][0].utc_datetime
                            )
                            .diff(
                              deps.moment(
                                (query_recordings.data as any)[a][0]
                                  .utc_datetime
                              )
                            )
                        )
                        .map((v: any) => ({
                          header: v,
                          children: (query_recordings.data as any)[v]
                            .toSorted((a: any, b: any) =>
                              deps
                                .moment(b.utc_datetime)
                                .diff(deps.moment(a.utc_datetime))
                            )
                            .map((x: any) => [
                              {
                                type: "TEXT",
                                text: `${x.time} - ${x.tags.join(", ")} - "${
                                  x.transcription
                                }"`,
                              },
                              {
                                type: "BUTTON",
                                on_click: () => {
                                  if (playing_audio == x.id) {
                                    stop_play_audio();
                                    set_playing_audio(undefined);
                                  } else {
                                    audio.current.play().catch(() => {});
                                    mutation_play_audio.mutate({ id: x.id });
                                    set_playing_audio(x.id);
                                  }
                                },
                                text:
                                  playing_audio == x.id
                                    ? "Stop Playing"
                                    : "Play",
                                confirm: undefined,
                              },
                              {
                                type: "BUTTON",
                                on_click: () => {
                                  let name = prompt("Toggle tag:");
                                  if (name === null) return;

                                  if (x.tags.includes(name)) {
                                    mutation_remove_recording_tag.mutate({
                                      id: x.id,
                                      name: name,
                                    });
                                  } else {
                                    mutation_add_recording_tag.mutate({
                                      id: x.id,
                                      name: name,
                                    });
                                  }
                                },
                                text: "Toggle Tag",
                                confirm: undefined,
                              },
                              {
                                type: "BUTTON",
                                on_click: () =>
                                  mutation_remove_recording.mutate({
                                    id: x.id,
                                  }),
                                text: "Delete Recording",
                                confirm: "Are you sure?",
                              },
                            ])
                            .reduce((acc: any, cur: any) => {
                              acc.push(...cur);
                              return acc;
                            }, []),
                        })) as any
                    }
                  />
                </components.layout.stack.Cell>
              </components.layout.stack.Stack>
            </components.layout.scrollable.Scrollable>
          </components.layout.wrapper.Wrapper>
        </components.layout.level.Ascend>
      </components.layout.stack.Cell>
    </components.asite.page_wrap.PageWrap>
  );
};

export { Home };
