import { components } from "../../../meta";

const Panel = () => (
  <components.layout.size_breakpoint.SizeBreakpoint
    def={
      <components.layout.level.Ascend>
        <components.layout.container.Container
          height="h-12"
          width="w-full"
          background="LEVEL"
          x_padding="MEDIUM"
          y_padding="SMALL"
        >
          <components.layout.stack.Stack direction="HORIZONTAL">
            <components.layout.stack.Cell grow />

            <components.layout.stack.Cell>
              <components.layout.container.Container width="w-10">
                <components.asite.sidebar.PanelHomeButton />
              </components.layout.container.Container>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell grow />

            <components.layout.stack.Cell>
              <components.layout.container.Container width="w-10">
                <components.asite.sidebar.PanelAppsButton />
              </components.layout.container.Container>
            </components.layout.stack.Cell>

            <components.layout.stack.Cell grow />
          </components.layout.stack.Stack>
        </components.layout.container.Container>
      </components.layout.level.Ascend>
    }
    md={
      <components.layout.level.Ascend>
        <components.layout.container.Container
          width="w-14"
          height="h-full"
          background="LEVEL"
          x_padding="MEDIUM"
          y_padding="LARGE"
        >
          <components.layout.stack.Stack direction="VERTICAL" gap="LARGE">
            <components.layout.stack.Cell>
              <components.asite.sidebar.PanelHomeButton />
            </components.layout.stack.Cell>

            <components.layout.stack.Cell>
              <components.asite.sidebar.PanelAppsButton />
            </components.layout.stack.Cell>
          </components.layout.stack.Stack>
        </components.layout.container.Container>
      </components.layout.level.Ascend>
    }
  ></components.layout.size_breakpoint.SizeBreakpoint>
);

export default Panel;
