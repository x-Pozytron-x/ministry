// Centralized Font Awesome icon exports
// Import from this file everywhere instead of importing FA directly.
// Only add icons that are actually used in the app.

import {
  faChartBar,
  faChartSimple,
  faUsers,
  faHouse,
  faClipboardList,
  faGear,
  faFloppyDisk,
  faRightFromBracket,
  faPencil,
  faTrashCan,
  faFile,
  faFolderOpen,
  faUser,
  faCalendar,
  faClock,
  faBook,
  faVideo,
  faArrowsRotate,
  faBookOpen,
  faBroom,
  faCheck,
  faTriangleExclamation,
  faPlus,
  faLock,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons';

// Navigation
export const ICON_DASHBOARD = faChartBar;
export const ICON_ATTENDANCE = faChartSimple;
export const ICON_PUBLISHERS = faUsers;
export const ICON_VPS = faHouse;
export const ICON_SERVICE_RECORDS = faFileLines;
export const ICON_REPORTS = faClipboardList;
export const ICON_SETTINGS = faGear;

// Actions
export const ICON_SAVE = faFloppyDisk;
export const ICON_LOGOUT = faRightFromBracket;
export const ICON_CREATE = faPlus;
export const ICON_OPEN = faFolderOpen;
export const ICON_EDIT = faPencil;
export const ICON_DELETE = faTrashCan;

// Status & info
export const ICON_FILE = faFile;
export const ICON_FOLDER = faFolderOpen;
export const ICON_USER = faUser;
export const ICON_CALENDAR = faCalendar;
export const ICON_CLOCK = faClock;
export const ICON_BOOK = faBook;
export const ICON_VIDEO = faVideo;
export const ICON_RETURN = faArrowsRotate;
export const ICON_BIBLE = faBookOpen;
export const ICON_BROOM = faBroom;
export const ICON_CHECK = faCheck;
export const ICON_WARNING = faTriangleExclamation;
export const ICON_LOCK = faLock;
