export type ObjectType = {
  type: string;
  label: string;
  icon: string;
  // panel?: typeof PANEL_CUSTOM | typeof PANEL_WORKSHEET;
};

export type ObjectGroup = {
  name: string;
  label: string;
  objects: Array<ObjectType>;
};

export type ObjectsList = Array<ObjectGroup>;

export type ViewObject = {
  type: string;
  label: string;
  transform: {
    x: number;
    y: number;
  };
  config: {
    [key: string]: any;
  };
};
