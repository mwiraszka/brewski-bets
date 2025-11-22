export interface Page {
  title: string;
  path: string;
  sections?: Array<{ title: string; fragment: string }>;
}
