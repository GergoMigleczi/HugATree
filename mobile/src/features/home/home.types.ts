export type HomeTile = {
  id: string;
  title: string;
  subtitle?: string;

  cols: 1 | 2;
  rows: 1 | 2;

  onPress: () => void;
};