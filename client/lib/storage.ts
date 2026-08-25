export function organizerStorageKey(publicId: string) {
  return `scheduler:organizer:${publicId}`;
}

export function responseStorageKey(publicId: string) {
  return `scheduler:response:${publicId}`;
}
