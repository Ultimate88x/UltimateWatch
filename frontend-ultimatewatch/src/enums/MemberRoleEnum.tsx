export const MemberRoleEnum = {
  MEMBER: 'member',
  OWNER: 'owner',
  MODERATOR: 'moderator',
} as const;

export type MemberRole = typeof MemberRoleEnum[keyof typeof MemberRoleEnum];