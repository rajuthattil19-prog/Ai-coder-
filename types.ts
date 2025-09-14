export interface CodeStep {
  id: string;
  prompt: string;
  code: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
