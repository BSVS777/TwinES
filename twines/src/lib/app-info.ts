export const APP_NAME = "TwinES";

export function getAppTitle(section?: string): string {
  return section ? `${section} | ${APP_NAME}` : APP_NAME;
}
