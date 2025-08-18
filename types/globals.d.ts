// types/globals.d.ts
export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'SUPER_ADMIN' | 'AGENCY_ADMIN' | 'AGENCY_USER'
      agencyName?: string
      membershipType?: string
      onboarded?: boolean
    }
  }

  interface UserPublicMetadata {
    role?: 'SUPER_ADMIN' | 'AGENCY_ADMIN' | 'AGENCY_USER'
    agencyName?: string
    membershipType?: string
    onboarded?: boolean
  }
}