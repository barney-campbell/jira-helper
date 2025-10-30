export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceHover: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
    danger: string;
    dangerHover: string;
    success: string;
    successBorder: string;
    successText: string;
    info: string;
    infoBorder: string;
    infoText: string;
    error: string;
    warning: string;
    sidebar: string;
    sidebarButtonHover: string;
    sidebarButtonActive: string;
    scrollbarTrack: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
  };
}

export const lightTheme: Theme = {
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceHover: '#f8f9fa',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    primary: '#0052cc',
    primaryHover: '#0747a6',
    secondary: '#6c757d',
    secondaryHover: '#5a6268',
    danger: '#dc3545',
    dangerHover: '#c82333',
    success: '#d4edda',
    successBorder: '#c3e6cb',
    successText: '#155724',
    info: '#d1ecf1',
    infoBorder: '#bee5eb',
    infoText: '#0c5460',
    error: '#e53935',
    warning: '#fb8c00',
    sidebar: '#222222',
    sidebarButtonHover: 'rgba(0, 0, 0, 0.05)',
    sidebarButtonActive: 'rgba(0, 0, 0, 0.1)',
    scrollbarTrack: '#f1f1f1',
    scrollbarThumb: '#888888',
    scrollbarThumbHover: '#555555',
  },
};

export const darkTheme: Theme = {
  colors: {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceHover: '#3a3a3a',
    text: '#e0e0e0',
    textSecondary: '#b0b0b0',
    border: '#404040',
    primary: '#4c9aff',
    primaryHover: '#2684ff',
    secondary: '#8b959e',
    secondaryHover: '#7a8691',
    danger: '#ff5630',
    dangerHover: '#ff7452',
    success: '#1f3a2e',
    successBorder: '#2a4f3d',
    successText: '#7ee2b8',
    info: '#1f3a4a',
    infoBorder: '#2a4f6a',
    infoText: '#7ecaff',
    error: '#ff5630',
    warning: '#ffab00',
    sidebar: '#1a1a1a',
    sidebarButtonHover: 'rgba(255, 255, 255, 0.08)',
    sidebarButtonActive: 'rgba(255, 255, 255, 0.15)',
    scrollbarTrack: '#2d2d2d',
    scrollbarThumb: '#555555',
    scrollbarThumbHover: '#777777',
  },
};
