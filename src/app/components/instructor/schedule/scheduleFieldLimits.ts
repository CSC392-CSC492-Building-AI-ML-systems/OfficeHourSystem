export const SESSION_TOPIC_MAX_LENGTH = 30;
export const SESSION_DESCRIPTION_MAX_LENGTH = 500;
export const BLOCK_NAME_MAX_LENGTH = 30;
export const LOCATION_MAX_LENGTH = 15;

export function clampToMaxLength(value: string, maxLength: number): string {
  return value.slice(0, maxLength);
}
