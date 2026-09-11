import React from 'react';

interface MaterialFileIconProps {
  fileName: string;
  isFolder?: boolean;
  isOpen?: boolean;
  size?: number;
}

export const MaterialFileIcon: React.FC<MaterialFileIconProps> = ({
  fileName,
  isFolder = false,
  isOpen = false,
  size = 16
}) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (isFolder) {
    if (lowerName === 'src') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M3 4C3 2.89543 3.89543 2 5 2H9.58579C10.1162 2 10.625 2.21071 10.9999 2.58579L12.4142 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V4Z" fill="#0284c7" />
          <path d="M8.5 11L6.5 13L8.5 15" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.5 11L17.5 13L15.5 15" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (lowerName === 'components') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M3 4C3 2.89543 3.89543 2 5 2H9.58579C10.1162 2 10.625 2.21071 10.9999 2.58579L12.4142 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V4Z" fill="#0ea5e9" />
          <rect x="9" y="10" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.4" fill="#0284c7"/>
        </svg>
      );
    }
    // Default Material Folder
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {isOpen ? (
          <path d="M3 4C3 2.89543 3.89543 2 5 2H9.58579C10.1162 2 10.625 2.21071 10.9999 2.58579L12.4142 4H19C20.1046 4 21 4.89543 21 6V9H5C3.89543 9 3 9.89543 3 11V4ZM3 11L4.8 19.1C4.94 19.64 5.43 20 6 20H20C20.66 20 21.18 19.46 21.08 18.8L19.4 11H3Z" fill="#eab308" />
        ) : (
          <path d="M3 4C3 2.89543 3.89543 2 5 2H9.58579C10.1162 2 10.625 2.21071 10.9999 2.58579L12.4142 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V4Z" fill="#eab308" />
        )}
      </svg>
    );
  }

  // TypeScript React / TSX
  if (ext === 'tsx' || lowerName.endsWith('.tsx')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#1e293b"/>
        <ellipse cx="16" cy="16" rx="9" ry="3.5" stroke="#00d8ff" strokeWidth="1.6" transform="rotate(30 16 16)" />
        <ellipse cx="16" cy="16" rx="9" ry="3.5" stroke="#00d8ff" strokeWidth="1.6" transform="rotate(-30 16 16)" />
        <ellipse cx="16" cy="16" rx="9" ry="3.5" stroke="#00d8ff" strokeWidth="1.6" transform="rotate(90 16 16)" />
        <circle cx="16" cy="16" r="2" fill="#00d8ff" />
      </svg>
    );
  }

  // Pure TypeScript (.ts)
  if (ext === 'ts') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#3178c6"/>
        <text x="6" y="23" fill="#ffffff" fontFamily="sans-serif" fontWeight="900" fontSize="17">TS</text>
      </svg>
    );
  }

  // React JSX (.jsx)
  if (ext === 'jsx') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#20232a"/>
        <ellipse cx="16" cy="16" rx="10" ry="4" stroke="#61dafb" strokeWidth="1.8" transform="rotate(30 16 16)" />
        <ellipse cx="16" cy="16" rx="10" ry="4" stroke="#61dafb" strokeWidth="1.8" transform="rotate(-30 16 16)" />
        <circle cx="16" cy="16" r="2.2" fill="#61dafb" />
      </svg>
    );
  }

  // JavaScript (.js, .mjs)
  if (ext === 'js' || ext === 'mjs') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#f7df1e"/>
        <text x="7" y="23" fill="#000000" fontFamily="sans-serif" fontWeight="900" fontSize="16">JS</text>
      </svg>
    );
  }

  // JSON (.json)
  if (ext === 'json') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#1e293b"/>
        <text x="6" y="22" fill="#fbc02d" fontFamily="monospace" fontWeight="900" fontSize="18">{`{}`}</text>
      </svg>
    );
  }

  // Markdown (.md)
  if (ext === 'md') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#0284c7"/>
        <path d="M7 21V11L11 15L15 11V21M21 16V21M18 18.5L21 21.5L24 18.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  // CSS (.css)
  if (ext === 'css') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#2563eb"/>
        <text x="10" y="23" fill="#ffffff" fontFamily="sans-serif" fontWeight="900" fontSize="20">#</text>
      </svg>
    );
  }

  // HTML (.html)
  if (ext === 'html') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#ea580c"/>
        <text x="5" y="22" fill="#ffffff" fontFamily="monospace" fontWeight="900" fontSize="16">&lt;&gt;</text>
      </svg>
    );
  }

  // Git / .gitignore
  if (lowerName.includes('git')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#f05032"/>
        <circle cx="10" cy="16" r="3" fill="#ffffff"/>
        <circle cx="22" cy="11" r="3" fill="#ffffff"/>
        <circle cx="22" cy="21" r="3" fill="#ffffff"/>
        <path d="M10 16H16C18 16 19 11 22 11M16 16C18 16 19 21 22 21" stroke="#ffffff" strokeWidth="2"/>
      </svg>
    );
  }

  // Default code document
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  );
};
