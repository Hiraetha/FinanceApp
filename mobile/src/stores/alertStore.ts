import { create } from 'zustand';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export type AlertType = 'warning' | 'error' | 'success' | 'info';

export interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  buttons: AlertButton[];
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const inferType = (title: string): AlertType => {
  const t = title.toLowerCase();
  if (t.includes('peringatan') || t.includes('perhatian') || t.includes('warning')) {
    return 'warning';
  }
  if (t.includes('error') || t.includes('gagal') || t.includes('danger')) {
    return 'error';
  }
  if (t.includes('sukses') || t.includes('berhasil') || t.includes('success')) {
    return 'success';
  }
  return 'info';
};

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  buttons: [],

  showAlert: (options: AlertOptions) => {
    set({
      visible: true,
      title: options.title,
      message: options.message || '',
      type: options.type || inferType(options.title),
      buttons:
        options.buttons && options.buttons.length > 0
          ? options.buttons
          : [{ text: 'Mengerti', style: 'default' }],
    });
  },

  hideAlert: () => set({ visible: false }),
}));

export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  type?: AlertType,
) => {
  useAlertStore.getState().showAlert({
    title,
    message,
    buttons,
    type,
  });
};
