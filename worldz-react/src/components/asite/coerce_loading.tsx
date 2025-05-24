import { deps, utils } from "../../meta";

const CoerceLoading = () => {
  const resolve_prom = utils.react.use_ref<any>(undefined!);

  const wait_mutation = deps.query.use_mutation({
    mutationFn: async () =>
      await new Promise((resolve) => {
        resolve_prom.current = resolve;
      }),
  });

  utils.react.use_effect(() => {
    wait_mutation.mutate();

    return () => resolve_prom.current();
  }, []);

  return <></>;
};

export { CoerceLoading };
