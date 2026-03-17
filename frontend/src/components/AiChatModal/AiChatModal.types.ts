export type AiChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type QuickAction = {
  label: string;
  icon: "income" | "expense" | "planning" | "settings";
  action: "open_income" | "open_expense" | "navigate";
  path?: string;
};
